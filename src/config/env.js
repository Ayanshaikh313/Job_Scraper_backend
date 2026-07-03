require('dotenv').config();

const env = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/job-scraper',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expire: process.env.JWT_EXPIRE || '7d',
  },
  server: {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
};

module.exports = env;
