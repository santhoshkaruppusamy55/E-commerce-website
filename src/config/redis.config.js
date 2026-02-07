const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT || 6379,
  tls: {
    rejectUnauthorized: false   
  },
  
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: null,
  connectTimeout: 10000,      
  enableOfflineQueue: true    
});

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('ready', () => {
  console.log('Redis is ready to accept commands');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

redis.on('reconnecting', () => {
  console.log('Redis is reconnecting...');
});

redis.on('end', () => {
  console.log('Redis connection closed');
});

module.exports = redis;