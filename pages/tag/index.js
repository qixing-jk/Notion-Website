import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { cleanDataBeforeReturn, getGlobalData } from '@/lib/db/getSiteData'
import { DynamicLayout } from '@/themes/theme'
import { useRouter } from 'next/router'
import { LayoutTagIndex } from '@theme-components/LayoutTagIndex'

/**
 * 标签首页
 * @param {*} props
 * @returns
 */
const TagIndex = props => {
  const router = useRouter()
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return (
    <DynamicLayout
      theme={theme}
      layoutName='LayoutTagIndex'
      layout={LayoutTagIndex}
      {...props}
    />
  )
}

export async function getStaticProps(req) {
  const { locale } = req

  const from = 'tag-index-props'
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
        ) * 3
  }
}

export default TagIndex
