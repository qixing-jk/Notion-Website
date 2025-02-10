import { APPEARANCE, LANG, NOTION_PAGE_ID, THEME } from '@/blog.config'
import {
  getThemeConfig,
  saveDarkModeToLocalStorage,
  THEMES
} from '@/themes/theme'
import { useRouter } from 'next/router'
import { createContext, useContext, useEffect, useState } from 'react'
import {
  generateLocaleDict,
  initLocale,
  redirectUserLang,
  saveLangToLocalStorage
} from './lang'
import dynamic from 'next/dynamic'
import { siteConfig } from '@/lib/config'

// 登录验证相关
const enableClerk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const useUser = enableClerk
  ? dynamic(() => import('@clerk/nextjs').then(m => m.useUser), {
      ssr: false
    })
  : null
const { isLoaded, isSignedIn, user } = enableClerk
  ? useUser()
  : { isLoaded: true, isSignedIn: false, user: false }

/**
 * 全局上下文
 */
const GlobalContext = createContext()

export function GlobalContextProvider(props) {
  const {
    post,
    children,
    siteInfo,
    categoryOptions,
    tagOptions,
    NOTION_CONFIG
  } = props

  const [lang, updateLang] = useState(NOTION_CONFIG?.LANG || LANG) // 默认语言
  const [locale, updateLocale] = useState(
    generateLocaleDict(NOTION_CONFIG?.LANG || LANG)
  ) // 默认语言
  const [theme, setTheme] = useState(NOTION_CONFIG?.THEME || THEME) // 默认博客主题
  const [THEME_CONFIG, SET_THEME_CONFIG] = useState(null) // 主题配置

  const defaultDarkMode = NOTION_CONFIG?.APPEARANCE || APPEARANCE
  const [isDarkMode, updateDarkMode] = useState(defaultDarkMode === 'dark') // 默认深色模式
  const [onLoading, setOnLoading] = useState(false) // 抓取文章数据
  const router = useRouter()

  // 是否全屏
  const fullWidth = post?.fullWidth ?? false

  // 切换主题
  function switchTheme() {
    const query = router.query
    const currentTheme = query.theme || theme
    const currentIndex = THEMES.indexOf(currentTheme)
    const newIndex = currentIndex < THEMES.length - 1 ? currentIndex + 1 : 0
    const newTheme = THEMES[newIndex]
    query.theme = newTheme
    router.push({ pathname: router.pathname, query })
    return newTheme
  }

  // 抓取主题配置
  const updateThemeConfig = async theme => {
    const config = await getThemeConfig(theme)
    SET_THEME_CONFIG(config)
  }

  // 切换深色模式
  const toggleDarkMode = () => {
    const newStatus = !isDarkMode
    saveDarkModeToLocalStorage(newStatus)
    updateDarkMode(newStatus)
    const htmlElement = document.getElementsByTagName('html')[0]
    htmlElement.classList?.remove(newStatus ? 'light' : 'dark')
    htmlElement.classList?.add(newStatus ? 'dark' : 'light')
  }

  function changeLang(lang) {
    if (lang) {
      saveLangToLocalStorage(lang)
      updateLang(lang)
      updateLocale(generateLocaleDict(lang))
    }
  }

  // 添加路由变化时的语言处理
  useEffect(() => {
    initLocale(router.locale, changeLang, updateLocale)
  }, [router])

  useEffect(() => {
    // initDarkMode(updateDarkMode, defaultDarkMode)
    if (
      NOTION_CONFIG?.REDIRECT_LANG &&
      JSON.parse(NOTION_CONFIG?.REDIRECT_LANG)
    ) {
      redirectUserLang(NOTION_PAGE_ID)
    }
    setOnLoading(false)
  }, [])

  const handleStart = url => {
    if (siteConfig('THEME_SWITCH', null, NOTION_CONFIG)) {
      const { theme } = router.query
      if (theme && !url.includes(`theme=${theme}`)) {
        const newUrl = `${url}${url.includes('?') ? '&' : '?'}theme=${theme}`
        router.push(newUrl)
      }
    }
    if (!onLoading) {
      setOnLoading(true)
    }
  }

  const handleStop = () => {
    if (onLoading) {
      setOnLoading(false)
    }
  }

  useEffect(() => {
    if (siteConfig('THEME_SWITCH', null, NOTION_CONFIG)) {
      const currentTheme = router?.query?.theme || theme
      updateThemeConfig(currentTheme)
    }

    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeError', handleStop)
    router.events.on('routeChangeComplete', handleStop)
    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleStop)
      router.events.off('routeChangeError', handleStop)
    }
  }, [router, onLoading])

  return (
    <GlobalContext.Provider
      value={{
        isLoaded,
        isSignedIn,
        user,
        fullWidth,
        NOTION_CONFIG,
        THEME_CONFIG,
        toggleDarkMode,
        onLoading,
        setOnLoading,
        lang,
        changeLang,
        locale,
        updateLocale,
        isDarkMode,
        updateDarkMode,
        theme,
        setTheme,
        switchTheme,
        siteInfo,
        categoryOptions,
        tagOptions
      }}>
      {children}
    </GlobalContext.Provider>
  )
}

export const useGlobal = () => useContext(GlobalContext)
