import Link from 'next/link'
import { siteConfig } from '@/lib/config'

// 过滤 <a> 标签不能识别的 props
const filterDOMProps = props => {
  const {
    passHref,
    legacyBehavior,
    prefetch,
    replace,
    scroll,
    shallow,
    locale,
    ...rest
  } = props
  return rest
}

const SmartLink = ({ href, children, ...rest }) => {
  const LINK = siteConfig('LINK')

  // next/link 在 href 为 undefined/null 时会在内部调用 formatUrl(undefined) 导致构建期崩溃
  const isHrefString = typeof href === 'string'
  const isHrefObject = typeof href === 'object' && href !== null
  if (
    href === undefined ||
    href === null ||
    (isHrefString && href.trim() === '') ||
    (!isHrefString && !isHrefObject)
  ) {
    return <span {...filterDOMProps(rest)}>{children}</span>
  }

  // 获取 URL 字符串用于判断是否是外链
  let urlString = ''

  if (typeof href === 'string') {
    urlString = href
  } else if (
    typeof href === 'object' &&
    href !== null &&
    typeof href.pathname === 'string'
  ) {
    urlString = href.pathname
  }

  const isExternal =
    urlString.startsWith('http') && (!LINK || !urlString.startsWith(LINK))

  if (isExternal) {
    // 对于外部链接，必须是 string 类型
    const externalUrl =
      typeof href === 'string'
        ? href
        : LINK
          ? new URL(href.pathname, LINK).toString()
          : href.pathname

    return (
      <a
        href={externalUrl}
        target='_blank'
        rel='noopener noreferrer'
        {...filterDOMProps(rest)}>
        {children}
      </a>
    )
  }

  // 内部链接（可为对象形式）
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  )
}

export default SmartLink
