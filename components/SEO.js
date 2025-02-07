import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { loadExternalResource } from '@/lib/utils'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Fragment, memo, useEffect } from 'react'
import { CDN_TRANSFORM, CDNJS_CDN_BASE, JSDELIVR_CDN_BASE, LANG, NOTION_PAGE_ID, NPM_CDN_BASE } from '@/blog.config'
import { extractLangPrefix } from '@/lib/utils/pageId'

/**
 * 页面的Head头，有用于SEO
 * @param {*} param0
 * @returns
 */
const SEO = props => {
  const { siteInfo, post, NOTION_CONFIG } = props
  const PATH = siteConfig('PATH')
  const LINK = siteConfig('LINK')
  const SUB_PATH = siteConfig('SUB_PATH', '')
  const siteIds = NOTION_PAGE_ID?.split(',') || []
  let url = PATH?.length ? `${LINK}/${SUB_PATH}` : LINK
  let image
  const router = useRouter()
  const meta = getSEOMeta(props, router, useGlobal()?.locale)
  const webFontUrl = siteConfig('FONT_URL')

  useEffect(() => {
    if (webFontUrl.length) {
      // 使用WebFontLoader字体加载
      loadExternalResource(
        'https://cdnjs.cloudflare.com/ajax/libs/webfont/1.6.28/webfontloader.js',
        'js'
      ).then(url => {
        const WebFont = window?.WebFont
        if (WebFont) {
          // console.log('LoadWebFont', webFontUrl)
          WebFont.load({
            custom: {
              // families: ['"LXGW WenKai"'],
              urls: webFontUrl
            }
          })
        }
      })
    }
  }, [])

  // SEO关键词
  const KEYWORDS = siteConfig('KEYWORDS')
  let keywords = meta?.tags || KEYWORDS
  if (post?.tags && post?.tags?.length > 0) {
    keywords = post?.tags?.join(',')
  }
  if (meta) {
    url = `${url}/${meta.slug}`
    image = meta.image || '/bg_image.jpg'
  }
  const TITLE = siteConfig('TITLE')
  const title = meta?.title || TITLE
  const description = meta?.description || `${siteInfo?.description}`
  const type = meta?.type || 'website'
  const lang = siteConfig('LANG').replace('-', '_') // Facebook OpenGraph 要 zh_CN 這樣的格式才抓得到語言
  const category = meta?.category || KEYWORDS // section 主要是像是 category 這樣的分類，Facebook 用這個來抓連結的分類
  const favicon = siteConfig('BLOG_FAVICON')
  const BACKGROUND_DARK = siteConfig('BACKGROUND_DARK', '', NOTION_CONFIG)

  const SEO_BAIDU_SITE_VERIFICATION = siteConfig(
    'SEO_BAIDU_SITE_VERIFICATION',
    null,
    NOTION_CONFIG
  )

  const SEO_GOOGLE_SITE_VERIFICATION = siteConfig(
    'SEO_GOOGLE_SITE_VERIFICATION',
    null,
    NOTION_CONFIG
  )

  const BLOG_FAVICON = siteConfig('BLOG_FAVICON', null, NOTION_CONFIG)

  const COMMENT_WEBMENTION_ENABLE = siteConfig(
    'COMMENT_WEBMENTION_ENABLE',
    null,
    NOTION_CONFIG
  )

  const COMMENT_WEBMENTION_HOSTNAME = siteConfig(
    'COMMENT_WEBMENTION_HOSTNAME',
    null,
    NOTION_CONFIG
  )
  const COMMENT_WEBMENTION_AUTH = siteConfig(
    'COMMENT_WEBMENTION_AUTH',
    null,
    NOTION_CONFIG
  )
  const ANALYTICS_BUSUANZI_ENABLE = siteConfig(
    'ANALYTICS_BUSUANZI_ENABLE',
    null,
    NOTION_CONFIG
  )

  const CDN_PRECONNECT = siteConfig('CDN_PRECONNECT', null, NOTION_CONFIG)

  const AUTHOR = siteConfig('AUTHOR')
  return (
    <Head>
      <link rel='icon' href={favicon} />
      <title>{title}</title>
      {meta &&
        siteIds.map(siteId => {
          const langPrefix = extractLangPrefix(siteId) || LANG.slice(0, 2)
          return (
            <link
              key={langPrefix}
              rel='alternate'
              hrefLang={langPrefix}
              href={`${LINK}/${SUB_PATH && SUB_PATH + '/'}${langPrefix}/${meta.slug}`}
            />
          )
        })}
      <meta name='theme-color' content={BACKGROUND_DARK} />
      <meta
        name='viewport'
        content='width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0'
      />
      <meta name='robots' content='follow, index' />
      <meta charSet='UTF-8' />
      {SEO_GOOGLE_SITE_VERIFICATION && (
        <meta
          name='google-site-verification'
          content={SEO_GOOGLE_SITE_VERIFICATION}
        />
      )}
      {SEO_BAIDU_SITE_VERIFICATION && (
        <meta
          name='baidu-site-verification'
          content={SEO_BAIDU_SITE_VERIFICATION}
        />
      )}
      <meta name='keywords' content={keywords} />
      <meta name='description' content={description} />
      <meta property='og:locale' content={lang} />
      <meta property='og:title' content={title} />
      <meta property='og:description' content={description} />
      <meta property='og:url' content={url} />
      <meta property='og:image' content={image} />
      <meta property='og:site_name' content={title} />
      <meta property='og:type' content={type} />
      <meta property='og:logo' content={BLOG_FAVICON} />
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:description' content={description} />
      <meta name='twitter:title' content={title} />

      <link rel='icon' href={BLOG_FAVICON} />
      {CDN_PRECONNECT.map(transformCDNUrl => (
        <Fragment key={transformCDNUrl}>
          <link rel='preconnect' href={transformCDNUrl} />
          <link rel='dns-prefetch' href={transformCDNUrl} />
        </Fragment>
      ))}
      {CDN_TRANSFORM && (
        <>
          {NPM_CDN_BASE && <link rel='dns-prefetch' href={NPM_CDN_BASE} />}
          {CDNJS_CDN_BASE && <link rel='dns-prefetch' href={CDNJS_CDN_BASE} />}
          {JSDELIVR_CDN_BASE && (
            <link rel='dns-prefetch' href={JSDELIVR_CDN_BASE} />
          )}
        </>
      )}
      {COMMENT_WEBMENTION_ENABLE && (
        <>
          <link
            rel='webmention'
            href={`https://webmention.io/${COMMENT_WEBMENTION_HOSTNAME}/webmention`}
          />
          <link
            rel='pingback'
            href={`https://webmention.io/${COMMENT_WEBMENTION_HOSTNAME}/xmlrpc`}
          />
          {COMMENT_WEBMENTION_AUTH && (
            <link href={COMMENT_WEBMENTION_AUTH} rel='me' />
          )}
        </>
      )}

      {ANALYTICS_BUSUANZI_ENABLE && (
        <meta name='referrer' content='no-referrer-when-downgrade' />
      )}
      {meta?.type === 'Post' && (
        <>
          <meta property='article:published_time' content={post.publishDay} />
          <meta
            property='article:modified_time'
            content={post.lastEditedDate}
          />
          <meta property='article:author' content={AUTHOR} />
          <meta property='article:section' content={category} />
          <meta property='article:publisher' content={LINK} />
          {post?.tags?.map(tag => (
            <meta key={tag} property='article:tag' content={tag} />
          ))}
        </>
      )}
    </Head>
  )
}

/**
 * 获取SEO信息
 * @param {*} props
 * @param {*} router
 */
const getSEOMeta = (props, router, locale) => {
  const { post, siteInfo, tag, category, page } = props
  const keyword = router?.query?.s

  const TITLE = siteConfig('TITLE')
  switch (router.route) {
    case '/':
      return {
        title: `${siteInfo?.title} | ${siteInfo?.description}`,
        description: `${siteInfo?.description}`,
        image: `${siteInfo?.pageCover}`,
        slug: '',
        type: 'website'
      }
    case '/archive':
      return {
        title: `${locale.NAV.ARCHIVE} | ${siteInfo?.title}`,
        description: `${locale.NAV.ARCHIVE} ${locale.COMMON.RELATE_POSTS}`,
        image: `${siteInfo?.pageCover}`,
        slug: 'archive',
        type: 'website'
      }
    case '/page/[page]':
      return {
        title: `${page} | Page | ${siteInfo?.title}`,
        description: `${page} Page ${locale.COMMON.ARTICLE_LIST}`,
        image: `${siteInfo?.pageCover}`,
        slug: 'page/' + page,
        type: 'website'
      }
    case '/category/[category]':
      return {
        title: `${category} | ${locale.COMMON.CATEGORY} | ${siteInfo?.title}`,
        description: `${category} ${locale.COMMON.RELATE_POSTS}`,
        slug: 'category/' + category,
        image: `${siteInfo?.pageCover}`,
        type: 'website'
      }
    case '/category/[category]/page/[page]':
      return {
        title: `${category} | ${locale.COMMON.CATEGORY} | ${siteInfo?.title}`,
        description: `${page} Page ${category} ${locale.COMMON.RELATE_POSTS} ${locale.COMMON.ARTICLE_LIST}`,
        slug: 'category/' + category,
        image: `${siteInfo?.pageCover}`,
        type: 'website'
      }
    case '/tag/[tag]':
      return {
        title: `${tag} | ${locale.COMMON.TAGS} | ${siteInfo?.title}`,
        description: `${tag} ${locale.COMMON.RELATE_POSTS}`,
        image: `${siteInfo?.pageCover}`,
        slug: 'tag/' + tag,
        type: 'website'
      }
    case '/tag/[tag]/page/[page]':
      return {
        title: `${tag} | ${locale.COMMON.TAGS} | ${siteInfo?.title}`,
        description: `${page} Page ${tag} ${locale.COMMON.RELATE_POSTS} ${locale.COMMON.ARTICLE_LIST}`,
        image: `${siteInfo?.pageCover}`,
        slug: 'tag/' + tag,
        type: 'website'
      }
    case '/search':
      return {
        title: `${keyword || ''}${keyword ? ' | ' : ''}${locale.NAV.SEARCH} | ${siteInfo?.title}`,
        description: `${siteInfo?.description}`,
        image: `${siteInfo?.pageCover}`,
        slug: 'search',
        type: 'website'
      }
    case '/search/[keyword]':
    case '/search/[keyword]/page/[page]':
      return {
        title: `${keyword || ''}${keyword ? ' | ' : ''}${locale.NAV.SEARCH} | ${siteInfo?.title}`,
        description: TITLE,
        image: `${siteInfo?.pageCover}`,
        slug: 'search/' + (keyword || ''),
        type: 'website'
      }
    case '/404':
      return {
        title: `${siteInfo?.title} | 页面找不到啦`,
        image: `${siteInfo?.pageCover}`
      }
    case '/tag':
      return {
        title: `${locale.COMMON.TAGS} | ${siteInfo?.title}`,
        description: `${locale.COMMON.TAGS} ${locale.COMMON.RELATE_POSTS}`,
        image: `${siteInfo?.pageCover}`,
        slug: 'tag',
        type: 'website'
      }
    case '/category':
      return {
        title: `${locale.COMMON.CATEGORY} | ${siteInfo?.title}`,
        description: `${locale.COMMON.CATEGORY} ${locale.COMMON.RELATE_POSTS}`,
        image: `${siteInfo?.pageCover}`,
        slug: 'category',
        type: 'website'
      }
    default:
      return {
        title: post
          ? `${post?.title} | ${siteInfo?.title}`
          : `${siteInfo?.title || '加载中'} | loading`,
        description: post?.aiSummary || post?.summary,
        type: post?.type,
        slug: post?.slug,
        image: post?.pageCoverThumbnail || `${siteInfo?.pageCover}`,
        category: post?.category,
        tags: post?.tags
      }
  }
}

export default memo(SEO)
