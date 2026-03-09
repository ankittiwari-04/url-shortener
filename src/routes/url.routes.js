const express = require('express');
const router = express.Router();
const { 
  shortenUrl, 
  redirectUrl,
  getAnalytics 
} = require('../controllers/url.controller');
const { shortenLimiter } = require('../middlewares/ratelimiter');

router.post('/shorten', shortenLimiter, shortenUrl);
router.get('/analytics/:code', getAnalytics);
router.get('/:code', redirectUrl);

module.exports = router;