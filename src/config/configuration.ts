export default () => ({
  port: parseInt(process.env.PORT, 10) || 3033,
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'lbt:',
  },
  cache: {
    // Default TTL in seconds (24 hours)
    defaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL, 10) || 86400,
    // Lichess opening data TTL (7 days - this data rarely changes)
    lichessTtl: parseInt(process.env.CACHE_LICHESS_TTL, 10) || 604800,
  },
});
