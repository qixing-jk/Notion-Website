import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import Redis from 'ioredis'
import { isUpstashRedisRestApiUrl } from '@/lib/cache/upstash_redis_cache'

export const redisClient =
  BLOG.REDIS_URL && !isUpstashRedisRestApiUrl(BLOG.REDIS_URL)
    ? new Redis(BLOG.REDIS_URL)
    : null

export const redisCacheTime = Math.trunc(
  siteConfig('NEXT_REVALIDATE_SECOND', BLOG.NEXT_REVALIDATE_SECOND) * 1.5
)

export async function getCache(key) {
  try {
    const data = await redisClient.get(key)
    return data ? JSON.parse(data) : null
  } catch (e) {
    console.error(`redisClient读取失败 ${String(e)}`)
  }
}

export async function setCache(key, data, customCacheTime) {
  try {
    await redisClient.set(
      key,
      JSON.stringify(data),
      'EX',
      customCacheTime || redisCacheTime
    )
  } catch (e) {
    console.error(`redisClient写入失败 ${String(e)}`)
  }
}

export async function delCache(key) {
  try {
    await redisClient.del(key)
  } catch (e) {
    console.error(`redisClient删除失败 ${String(e)}`)
  }
}

export default { getCache, setCache, delCache }
