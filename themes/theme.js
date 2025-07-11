import BLOG from '@/blog.config'
import * as ThemeComponents from '@theme-components'
import { LayoutBase as LayoutBaseComponent } from '@theme-components/LayoutBase'
import getConfig from 'next/config'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { getQueryParam, isBrowser } from '../lib/utils'
import { siteConfig } from '@/lib/config'

// 在next.config.js中扫描所有主题
export const { THEMES = [] } = getConfig()?.publicRuntimeConfig || {}

/**
 * 获取主题配置
 * @param {string} themeQuery - 主题查询参数（支持多个主题用逗号分隔）
 * @returns {Promise<object>} 主题配置对象
 */
export const getThemeConfig = async themeQuery => {
  // 如果 themeQuery 存在且不等于默认主题，处理多主题情况
  if (typeof themeQuery === 'string' && themeQuery.trim()) {
    // 取 themeQuery 中第一个主题（以逗号为分隔符）
    const themeName = themeQuery.split(',')[0].trim()

    // 如果 themeQuery 不等于当前默认主题，则加载指定主题的配置
    if (themeName !== BLOG.THEME) {
      try {
        // 动态导入主题配置
        const THEME_CONFIG = await import(`@/themes/${themeName}`)
          .then(m => m.THEME_CONFIG)
          .catch(err => {
            console.error(`Failed to load theme ${themeName}:`, err)
            return null // 主题加载失败时返回 null 或者其他默认值
          })

        // 如果主题配置加载成功，返回配置
        if (THEME_CONFIG) {
          return THEME_CONFIG
        } else {
          // 如果加载失败，返回默认主题配置
          console.warn(
            `Loading ${themeName} failed. Falling back to default theme.`
          )
          return ThemeComponents?.THEME_CONFIG
        }
      } catch (error) {
        // 如果 import 过程中出现异常，返回默认主题配置
        console.error(
          `Error loading theme configuration for ${themeName}:`,
          error
        )
        return ThemeComponents?.THEME_CONFIG
      }
    }
  }

  // 如果没有 themeQuery 或 themeQuery 与默认主题相同，返回默认主题配置
  return ThemeComponents?.THEME_CONFIG
}

/**
 * 加载全局布局
 * @param {*} theme
 * @returns
 */
export const getBaseLayoutByTheme = theme => {
  const LayoutBase = LayoutBaseComponent || ThemeComponents['LayoutBase']
  const isDefaultTheme = !theme || theme === BLOG.THEME
  if (!isDefaultTheme) {
    return dynamic(
      () => import(`@/themes/${theme}/LayoutBase`).then(m => m['LayoutBase']),
      { ssr: true }
    )
  }
  return LayoutBase
}
/**
 * 动态获取布局
 * @param {*} props
 */
export const DynamicLayout = props => {
  const { theme, layoutName, layout } = props
  const SelectedLayout = useLayoutByTheme({ layoutName, theme, layout })
  return <SelectedLayout {...props} />
}

/**
 * 加载主题文件
 * @param {*} layoutName
 * @param {*} theme
 * @returns
 */
export const useLayoutByTheme = ({ layoutName, theme, layout }) => {
  // const layoutName = getLayoutNameByPath(router.pathname, router.asPath)
  const LayoutComponents =
    layout || ThemeComponents[layoutName] || ThemeComponents['LayoutSlug']
  if (siteConfig('THEME_SWITCH')) {
    const router = useRouter()
    const themeQuery = getQueryParam(router?.asPath, 'theme') || theme
    const isDefaultTheme = !themeQuery || themeQuery === BLOG.THEME
    // 加载非当前默认主题
    if (!isDefaultTheme) {
      return dynamic(
        () =>
          import(`@/themes/${themeQuery || BLOG.THEME}/${layoutName}`)
            .then(m => {
              setTimeout(fixThemeDOM, isDefaultTheme ? 100 : 500)
              return m[layoutName]
            })
            .catch(err => {
              import(`@/themes/${themeQuery || BLOG.THEME}/LayoutSlug`).then(
                m => {
                  setTimeout(fixThemeDOM, isDefaultTheme ? 100 : 500)
                  return m[layoutName]
                }
              )
            }),
        { ssr: true }
      )
    }
  }
  // setTimeout(fixThemeDOM, 100)
  return LayoutComponents
}

/**
 * 切换主题时的特殊处理
 * 删除多余的元素
 */
const fixThemeDOM = () => {
  if (isBrowser) {
    const elements = document.querySelectorAll('[id^="theme-"]')
    if (elements?.length > 1) {
      for (let i = 0; i < elements.length - 1; i++) {
        if (
          elements[i] &&
          elements[i].parentNode &&
          elements[i].parentNode.contains(elements[i])
        ) {
          elements[i].parentNode.removeChild(elements[i])
        }
      }
      elements[0]?.scrollIntoView()
    }
  }
}

/**
 * Whether to force dark mode
 * @returns {boolean} Whether to force dark mode
 * @description If `BLOG.APPEARANCE` is set to `'auto'`, this function will return `true` if:
 * - The system is in dark mode
 * - The current time is between `BLOG.APPEARANCE_DARK_TIME[0]` and `BLOG.APPEARANCE_DARK_TIME[1]`
 */
export const shouldDefaultDarkMode = () => {
  if (BLOG.APPEARANCE === 'auto') {
    // 系统深色模式或时间是夜间时，强行置为夜间模式
    const date = new Date()
    return (
      BLOG.APPEARANCE_DARK_TIME &&
      (date.getHours() >= BLOG.APPEARANCE_DARK_TIME[0] ||
        date.getHours() < BLOG.APPEARANCE_DARK_TIME[1])
    )
  }
}