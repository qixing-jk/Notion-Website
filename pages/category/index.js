import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { cleanDataBeforeReturn, getGlobalData } from '@/lib/db/getSiteData'
import { DynamicLayout } from '@/themes/theme'

/**
 * 分类首页
 * @param {*} props
 * @returns
 */
export default function Category(props) {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return (
    <DynamicLayout theme={theme} layoutName='LayoutCategoryIndex' {...props} />
  )
}

export async function getStaticProps({ locale }) {
  const from = 'search-props'
  const props = await getGlobalData({ from, locale })

  cleanDataBeforeReturn(props, from)
  return {
    props,
    revalidate: process.env.EXPORT
      ? undefined
      : siteConfig(
          'NEXT_REVALIDATE_SECOND',
          BLOG.NEXT_REVALIDATE_SECOND,
          props.NOTION_CONFIG
        ) * 2
  }
}
