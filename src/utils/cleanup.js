const Url = require('../models/Url.model');

const cleanupExpiredUrls = async () => {
  try {
    const result = await Url.deleteMany({
      expiresAt: { $ne: null, $lt: new Date() },
    });
    if (result.deletedCount > 0) {
      console.log(`🧹 Cleanup: deleted ${result.deletedCount} expired URLs`);
    }
  } catch (error) {
    console.error('Cleanup error:', error.message);
  }
};

const startCleanupJob = () => {
  setInterval(cleanupExpiredUrls, 60 * 60 * 1000);
  console.log('🧹 Cleanup job started — runs every hour');
};

module.exports = { startCleanupJob };