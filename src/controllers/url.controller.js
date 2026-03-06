const Url = require('../models/Url.model');
const generateShortCode = require('../utils/generateCode');

const shortenUrl = async (req, res) => {
  try {
    const { originalUrl, expiresInDays } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'originalUrl is required' 
      });
    }

    try {
      new URL(originalUrl);
    } catch {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid URL format' 
      });
    }

    const shortCode = generateShortCode();

    const expiresAt = expiresInDays
      ? new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000)
      : null;

    const url = await Url.create({
      originalUrl,
      shortCode,
      expiresAt,
    });

    return res.status(201).json({
      success: true,
      data: {
        shortCode: url.shortCode,
        shortUrl: `${process.env.BASE_URL}/${url.shortCode}`,
        originalUrl: url.originalUrl,
        expiresAt: url.expiresAt,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

module.exports = { shortenUrl };