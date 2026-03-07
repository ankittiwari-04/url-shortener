const Url = require('../models/Url.model');
const generateShortCode = require('../utils/generateCode');
const redis = require('../config/redis');

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

const redirectUrl = async (req, res) => {
  try {
    const { code } = req.params;

    // 1. Check Redis first
    const cached = await redis.get(`url:${code}`);

    if (cached) {
      console.log('Cache HIT ⚡');
      Url.findOneAndUpdate(
        { shortCode: code }, 
        { $inc: { clicks: 1 } }
      ).exec();
      return res.redirect(302, cached);
    }

    console.log('Cache MISS — querying MongoDB');

    // 2. Not in cache — query MongoDB
    const url = await Url.findOne({ shortCode: code });

    if (!url) {
      return res.status(404).json({ 
        success: false, 
        error: 'Short URL not found' 
      });
    }

    if (url.expiresAt && url.expiresAt < new Date()) {
      return res.status(410).json({ 
        success: false, 
        error: 'This link has expired' 
      });
    }

    // 3. Store in Redis for 24 hours
    await redis.set(`url:${code}`, url.originalUrl, 'EX', 86400);

    await Url.findByIdAndUpdate(url._id, { $inc: { clicks: 1 } });

    return res.redirect(302, url.originalUrl);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

module.exports = { shortenUrl, redirectUrl };