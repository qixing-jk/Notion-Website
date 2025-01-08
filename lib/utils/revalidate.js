import { countOccurrences } from '@/lib/utils/index'
import { siteConfig } from '@/lib/config'
import BLOG from '@/blog.config'

/**
 * 获取文章列表的Revalidate信息
 * @param props
 * @param hierarchy
 * @returns {undefined|*|string}
 */
export function getRevalidateTime(props, hierarchy) {
  return process.env.EXPORT
    ? undefined
    : countOccurrences(props.post.slug, '/') >= hierarchy
      ? siteConfig(
          'NEXT_REVALIDATE_SECOND',
          BLOG.NEXT_REVALIDATE_SECOND,
          props.NOTION_CONFIG
        )
      : undefined
}
