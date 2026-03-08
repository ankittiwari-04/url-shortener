const Url = require('../models/Url.model');
const Click = require('../models/Click.model');
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

    const cached = await redis.get(`url:${code}`);

    if (cached) {
      console.log('Cache HIT ⚡');
      Url.findOneAndUpdate(
        { shortCode: code },
        { $inc: { clicks: 1 } }
      ).exec();

      // Track click in background
      Click.create({
        shortCode: code,
        userAgent: req.headers['user-agent'] || 'unknown',
        ip: req.ip,
        referrer: req.headers['referer'] || 'direct',
      }).catch(err => console.error('Click tracking error:', err.message));

      return res.redirect(302, cached);
    }

    console.log('Cache MISS — querying MongoDB');

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

    await redis.set(`url:${code}`, url.originalUrl, 'EX', 86400);
    await Url.findByIdAndUpdate(url._id, { $inc: { clicks: 1 } });

    // Track click in background
    Click.create({
      shortCode: code,
      userAgent: req.headers['user-agent'] || 'unknown',
      ip: req.ip,
      referrer: req.headers['referer'] || 'direct',
    }).catch(err => console.error('Click tracking error:', err.message));

    return res.redirect(302, url.originalUrl);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const { code } = req.params;

    const url = await Url.findOne({ shortCode: code });
    if (!url) {
      return res.status(404).json({ 
        success: false, 
        error: 'URL not found' 
      });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const clicksByDay = await Click.aggregate([
      {
        $match: {
          shortCode: code,
          timestamp: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const topReferrers = await Click.aggregate([
      { $match: { shortCode: code } },
      { $group: { _id: '$referrer', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    return res.json({
      success: true,
      data: {
        shortCode: code,
        shortUrl: `${process.env.BASE_URL}/${code}`,
        originalUrl: url.originalUrl,
        totalClicks: url.clicks,
        createdAt: url.createdAt,
        expiresAt: url.expiresAt,
        clicksByDay,
        topReferrers,
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

module.exports = { shortenUrl, redirectUrl, getAnalytics };