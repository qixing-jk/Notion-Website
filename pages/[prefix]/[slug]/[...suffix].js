import BLOG from '@/blog.config'
import {
  cleanDataBeforeReturn,
  getGlobalData,
  getPost
} from '@/lib/db/getSiteData'
import { checkSlugHasMorThanTwoSlash, processPostData } from '@/lib/utils/post'
import { idToUuid } from 'notion-utils'
import Slug from '..'
import { getRevalidateTime } from '@/lib/utils/revalidate'
import { getOrSetDataWithCache } from '@/lib/cache/cache_manager'

/**
 * 根据notion的slug访问页面
 * 解析三级以上目录 /article/2023/10/29/test
 * @param {*} props
 * @returns
 */
const PrefixSlug = props => {
  return <Slug {...props} />
}

/**
 * 编译渲染页面路径
 * @returns
 */
export async function getStaticPaths() {
  if (!BLOG.isProd) {
    return {
      paths: [],
      fallback: true
    }
  }

  const from = 'slug-paths'
  const { allPages } = await getGlobalData({ from })
  const paths = allPages
    ?.filter(row => checkSlugHasMorThanTwoSlash(row))
    .map(row => ({
      params: {
        prefix: row.slug.split('/')[0],
        slug: row.slug.split('/')[1],
        suffix: row.slug.split('/').slice(2)
      }
    }))
  return {
    paths: paths,
    fallback: true
  }
}

/**
 * 抓取页面数据
 * @param {*} param0
 * @returns
 */
export async function getStaticProps({
  params: { prefix, slug, suffix },
  locale
}) {
  const fullSlug = prefix + '/' + slug + '/' + suffix.join('/')
  const from = `slug-props-${fullSlug}`
  let props = await getGlobalData({ from, locale })

  // 在列表内查找文章
  props.post = props?.allPages?.find(p => {
    return (
      p.type.indexOf('Menu') < 0 &&
      (p.slug === suffix ||
        p.slug === fullSlug.substring(fullSlug.lastIndexOf('/') + 1) ||
        p.slug === fullSlug ||
        p.id === idToUuid(fullSlug))
    )
  })

  // 处理非列表内文章的内信息
  if (!props?.post) {
    const pageId = fullSlug.slice(-1)[0]
    if (pageId.length >= 32) {
      props.post = await getPost(pageId)
    }
  }

  if (!props?.post) {
    // 无法获取文章
    return {
      notFound: true
    }
  } else {
    props = await getOrSetDataWithCache(
      `${props.post.id}_${props.post.lastEditedDay}`,
      async (props, from) => {
        await processPostData(props, from)
        cleanDataBeforeReturn(props, from)
        return props
      },
      props,
      from
    )
  }
  return {
    props,
    revalidate: getRevalidateTime(props, 2)
  }
}

export default PrefixSlug
