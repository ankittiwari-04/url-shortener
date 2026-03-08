const express = require('express');
const router = express.Router();
const { 
  shortenUrl, 
  redirectUrl,
  getAnalytics 
} = require('../controllers/url.controller');

router.post('/shorten', shortenUrl);
router.get('/analytics/:code', getAnalytics);
router.get('/:code', redirectUrl);

module.exports = router;