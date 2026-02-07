const redisConfig = require("./redis.config");

// Use the same ioredis client instance exported by redis.config.js
// This ensures consistent TLS/auth/connect options across the app and the worker
module.exports = {
  connection: redisConfig
};
