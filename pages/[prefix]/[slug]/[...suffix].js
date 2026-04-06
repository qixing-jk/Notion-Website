import { fetchGlobalAllData, resolvePostProps } from '@/lib/db/SiteDataApi'
import { checkSlugHasMorThanTwoSlash } from '@/lib/utils/post'
import Slug from '..'
import { getRevalidateTime } from '@/lib/utils/revalidate'
import { isExport } from '@/lib/utils/buildMode'
import { getPriorityPages, prefetchAllBlockMaps } from '@/lib/build/prefetch'

/**
 * 根据notion的slug访问页面
 * 解析三级以上目录 /article/2023/10/29/test
 * @param {*} props
 * @returns
 */
const PrefixSlug = props => {
  return <Slug {...props} />
}


export async function getStaticPaths() {
  const from = 'slug-paths'
  const { allPages } = await fetchGlobalAllData({ from })

  // Export 模式：全量预生成
  if (isExport()) {
    await prefetchAllBlockMaps(allPages)
    return {
      paths: allPages
        ?.filter(row => checkSlugHasMorThanTwoSlash(row))
        .map(row => ({
          params: {
            prefix: row.slug.split('/')[0],
            slug: row.slug.split('/')[1],
            suffix: row.slug.split('/').slice(2)
          }
        })),
      fallback: false
    }
  }

  // ISR 模式：预生成最新10篇（仅三段以上路径格式）
  const tops = getPriorityPages(allPages)

  await prefetchAllBlockMaps(tops)

  return {
    paths: tops
      .filter(p => checkSlugHasMorThanTwoSlash(p))
      .map(row => ({
        params: {
          prefix: row.slug.split('/')[0],
          slug: row.slug.split('/')[1],
          suffix: row.slug.split('/').slice(2)
        }
      })),
    fallback: 'blocking'
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

  const props = await resolvePostProps({
    prefix,
    slug,
    suffix,
    locale
  })

  return {
    props,
    revalidate: getRevalidateTime(props, 2),
    notFound: !props.post
  }
}

export default PrefixSlug
