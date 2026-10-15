const fs = require('fs');
const envText = fs.readFileSync('.env', 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0 && !line.trim().startsWith('#')) {
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    env[key] = val;
  }
});

const { Redis } = require('@upstash/redis');
const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

async function test() {
  const t0 = Date.now();
  await redis.set('test:benchmark', JSON.stringify({ message: 'Redis Cache Connected & Operational', timestamp: Date.now() }), { ex: 60 });
  const t1 = Date.now();
  const val = await redis.get('test:benchmark');
  const t2 = Date.now();
  console.log('Redis Write Latency:', (t1 - t0) + 'ms | Redis Read Latency:', (t2 - t1) + 'ms');
  console.log('Retrieved Data:', val);
}
test();
