import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { cleanDataBeforeReturn, getGlobalData } from '@/lib/db/getSiteData'
import { DynamicLayout } from '@/themes/theme'
import { LayoutSignUp } from '@theme-components/LayoutSignUp'

/**
 * 注册
 * @param {*} props
 * @returns
 */
const SignUp = props => {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return (
    <DynamicLayout
      theme={theme}
      layoutName='LayoutSignUp'
      layout={LayoutSignUp}
      {...props}
    />
  )
}

export async function getStaticProps(req) {
  const { locale } = req

  const from = 'SignIn'
  const props = await getGlobalData({ from, locale })

  delete props.allPages
  cleanDataBeforeReturn(props, from)
  return {
    props,
    revalidate: process.env.EXPORT
      ? undefined
      : siteConfig(
          'NEXT_REVALIDATE_SECOND',
          BLOG.NEXT_REVALIDATE_SECOND,
          props.NOTION_CONFIG
        )
  }
}

/**
 * catch-all route for clerk
 * @returns
 */
export async function getStaticPaths() {
  return {
    paths: [
      { params: { index: [] } }, // 使 /sign-up 路径可访问
      { params: { index: ['sign-up'] } } // 明确 sign-up 生成路径
    ],
    fallback: 'blocking' // 使用 'blocking' 模式让未生成的路径也能正确响应
  }
}
export default SignUp
