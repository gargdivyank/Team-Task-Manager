import mongoose from 'mongoose';

const g = globalThis;
const cacheKey = '__tmMongoose';

function getCache() {
  if (!g[cacheKey]) {
    g[cacheKey] = { conn: null, promise: null };
  }
  return g[cacheKey];
}

/**
 * Connects to MongoDB using MONGODB_URI from environment.
 * Reuses the connection across invocations (important on serverless).
 */
export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined');
  }

  const cache = getCache();
  if (cache.conn?.readyState === 1) {
    return cache.conn;
  }

  if (!cache.promise) {
    mongoose.set('strictQuery', true);
    cache.promise = mongoose.connect(uri).then(
      () => mongoose.connection,
      (err) => {
        cache.promise = null;
        throw err;
      }
    );
  }

  cache.conn = await cache.promise;
  if (mongoose.connection.readyState === 1) {
    console.log('MongoDB connected');
  }
  return cache.conn;
}
