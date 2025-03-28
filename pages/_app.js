// import '@/styles/animate.css' // @see https://animate.style/
import '@/styles/globals.css'
import '@/styles/utility-patterns.css'
import { GlobalContextProvider } from '@/lib/global'
import { getBaseLayoutByTheme, shouldDefaultDarkMode } from '@/themes/theme'
import { useRouter } from 'next/router'
import { useCallback, useInsertionEffect, useMemo } from 'react'
import { getQueryParam } from '../lib/utils'
// core styles shared by all of react-notion-x (required)
import 'react-notion-x/src/styles.css' // 原版的react-notion-x
import '@/styles/notion.css' //  重写部分notion样式
// 各种扩展插件 这个要阻塞引入
import BLOG from '@/blog.config'
import SEO from '@/components/SEO'
import dynamic from 'next/dynamic'
import { ThemeProvider } from 'next-themes'

const ExternalPlugins = dynamic(() => import('@/components/ExternalPlugins'))

const SpeedInsights = dynamic(
  () =>
    import('@vercel/speed-insights/next').then(module => module.SpeedInsights),
)

const enableClerk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

const enableVercelSpeedInsight = process.env.NEXT_PUBLIC_VERCEL_SPEED_INSIGHT

const ClerkProvider = dynamic(() =>
  import('@clerk/nextjs').then(m => m.ClerkProvider)
)
const zhCN = enableClerk
  ? dynamic(() => import('@clerk/localizations').then(m => m.zhCN))
  : null

const defaultTheme = BLOG.APPEARANCE === 'auto' ? 'system' : BLOG.APPEARANCE

/**
 * App挂载DOM 入口文件
 * @param {*} param0
 * @returns
 */
const MyApp = ({ Component, pageProps }) => {
  const route = useRouter()
  const theme = useMemo(() => {
    return (
      getQueryParam(route.asPath, 'theme') ||
      pageProps?.NOTION_CONFIG?.THEME ||
      BLOG.THEME
    )
  }, [route])

  // 整体布局
  const GLayout = useCallback(
    props => {
      const Layout = getBaseLayoutByTheme(theme)
      return <Layout {...props} />
    },
    [theme]
  )

  // 加载 font-awesome
  useInsertionEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = BLOG.FONT_AWESOME
    link.id = 'font-awesome'
    document.head.appendChild(link)
    // cleanup function
    return () => {
      const linkElm = document.getElementById('font-awesome')
      if (linkElm) {
        linkElm.remove()
      }
    }
  })

  const content = (
    <>
      <ThemeProvider
        defaultTheme={shouldDefaultDarkMode() ? 'dark' : defaultTheme}
        attribute='class'
        enableSystem={true}
        forcedTheme={Component.theme || undefined}>
        <GlobalContextProvider {...pageProps}>
          <SEO {...pageProps} />
          <GLayout {...pageProps}>
            <Component {...pageProps} />
          </GLayout>
          <ExternalPlugins {...pageProps} />
        </GlobalContextProvider>
      </ThemeProvider>
      {enableVercelSpeedInsight && <SpeedInsights />}
    </>
  )
  return (
    <>
      {enableClerk ? (
        <ClerkProvider localization={zhCN}>{content}</ClerkProvider>
      ) : (
        content
      )}
    </>
  )
}

export default MyApp
