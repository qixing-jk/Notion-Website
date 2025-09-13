const { THEME } = require('./blog.config')
const fs = require('fs')
const path = require('path')
const BLOG = require('./blog.config')
const { extractLangPrefix } = require('./lib/utils/pageId')

// 打包时是否分析代码
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: BLOG.BUNDLE_ANALYZER
})

// 扫描项目 /themes下的目录名
const themes = scanSubdirectories(path.resolve(__dirname, 'themes'))
// 检测用户开启的多语言
const locales = (function () {
  // 根据BLOG_NOTION_PAGE_ID 检查支持多少种语言数据.
  // 支持如下格式配置多个语言的页面id xxx,zh:xxx,en:xxx
  const langs = [BLOG.LANG]
  if (BLOG.NOTION_PAGE_ID.indexOf(',') > 0) {
    const siteIds = BLOG.NOTION_PAGE_ID.split(',')
    for (let index = 0; index < siteIds.length; index++) {
      const siteId = siteIds[index]
      const prefix = extractLangPrefix(siteId)
      // 如果包含前缀 例如 zh , en 等
      if (prefix) {
        if (!langs.includes(prefix)) {
          langs.push(prefix)
        }
      }
    }
  }
  return langs
})()

// 删除文件，并自动生成日志
function deleteFileIfExists(relativePath) {
  // 使用 path.resolve 解析为完整路径
  const filePath = path.resolve(__dirname, relativePath)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    // 通过路径生成文件名和目录
    const fileName = path.basename(filePath) // 获取文件名
    const directory = path.dirname(filePath) // 获取文件所在目录
    const relativeDirectory = path.relative(__dirname, directory) // 获取相对路径
    // 生成日志消息
    console.log(
      `Deleted existing ${fileName} from ${relativeDirectory || 'root directory'}`
    )
  }
}

// 编译前执行
;(function () {
  if (
    !process.env.npm_lifecycle_event === 'export' &&
    !process.env.npm_lifecycle_event === 'build'
  ) {
    return
  }
  // 删除 public/sitemap.xml 文件
  deleteFileIfExists('public/sitemap.xml')
  // 删除根目录的 sitemap.xml 文件
  deleteFileIfExists('sitemap.xml')
  // 删除 rss 文件
  deleteFileIfExists('public/rss/feed.xml')
  deleteFileIfExists('public/rss/atom.xml')
  deleteFileIfExists('public/rss/feed.json')
})()

/**
 * 扫描指定目录下的文件夹名，用于获取所有主题
 * @param {*} directory
 * @returns
 */
function scanSubdirectories(directory) {
  const subdirectories = []

  fs.readdirSync(directory).forEach(file => {
    const fullPath = path.join(directory, file)
    const stats = fs.statSync(fullPath)
    if (stats.isDirectory()) {
      subdirectories.push(file)
    }

    // subdirectories.push(file)
  })

  return subdirectories
}

/**
 * @type {import('next').NextConfig}
 */

const nextConfig = {
  productionBrowserSourceMaps: process.env.VERCEL_ENV !== 'production',
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true
  },
  output: process.env.EXPORT
    ? 'export'
    : process.env.NEXT_BUILD_STANDALONE === 'true'
      ? 'standalone'
      : undefined,
  staticPageGenerationTimeout: 120,

  // 性能优化配置
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  // 构建优化
  modularizeImports: {
    '@heroicons/react/24/outline': {
      transform: '@heroicons/react/24/outline/{{member}}'
    },
    '@heroicons/react/24/solid': {
      transform: '@heroicons/react/24/solid/{{member}}'
    }
  },
  // 多语言， 在export时禁用
  i18n: process.env.EXPORT
    ? undefined
    : {
        defaultLocale: BLOG.LANG,
        // 支持的所有多语言,按需填写即可
        locales: locales
      },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.notion.so' },
      { protocol: 'https', hostname: 'notion.so' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'abs.twimg.com' },
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol: 'https', hostname: 's3.us-west-2.amazonaws.com' }
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // 图片压缩和格式优化
    formats: ['image/avif', 'image/webp'],
    // 图片尺寸优化
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 允许next/image加载的图片 域名
    domains: [
      'gravatar.com',
      'www.notion.so',
      'avatars.githubusercontent.com',
      'images.unsplash.com',
      'source.unsplash.com',
      'p1.qhimg.com',
      'webmention.io',
      'ko-fi.com'
    ],
    // 图片加载器优化
    loader: 'default',
    // 图片缓存优化
    minimumCacheTTL: 60 * 60 * 24 * 7 // 7天
    // 危险的允许SVG
  },

  // 默认将feed重定向至 /public/rss/feed.xml
  redirects: process.env.EXPORT
    ? undefined
    : () => {
        return [
          {
            source: '/feed',
            destination: '/rss/feed.xml',
            permanent: true
          }
        ]
      },
  // 重写url
  rewrites: process.env.EXPORT
    ? undefined
    : () => {
        // 处理多语言重定向
        const langsRewrites = []
        if (BLOG.NOTION_PAGE_ID.indexOf(',') > 0) {
          const siteIds = BLOG.NOTION_PAGE_ID.split(',')
          const langs = []
          for (let index = 0; index < siteIds.length; index++) {
            const siteId = siteIds[index]
            const prefix = extractLangPrefix(siteId)
            // 如果包含前缀 例如 zh , en 等
            if (prefix) {
              langs.push(prefix)
            }
            console.log('[Locales]', siteId)
          }

          // 映射多语言
          // 示例： source: '/:locale(zh|en)/:path*' ; :locale() 会将语言放入重写后的 `?locale=` 中。
          langsRewrites.push(
            {
              source: `/:locale(${langs.join('|')})/:path*`,
              destination: '/:path*'
            },
            // 匹配没有路径的情况，例如 [domain]/zh 或 [domain]/en
            {
              source: `/:locale(${langs.join('|')})`,
              destination: '/'
            },
            // 匹配没有路径的情况，例如 [domain]/zh/ 或 [domain]/en/
            {
              source: `/:locale(${langs.join('|')})/`,
              destination: '/'
            }
          )
        }

        return [
          ...langsRewrites,
          // 伪静态重写
          {
            source: '/:path*.html',
            destination: '/:path*'
          }
        ]
      },
  headers: process.env.EXPORT
    ? undefined
    : () => {
        return [
          {
            source: '/:path*{/}?',
            headers: [
              // 为了博客兼容性，不做过多安全限制
              { key: 'Access-Control-Allow-Credentials', value: 'true' },
              { key: 'Access-Control-Allow-Origin', value: '*' },
              {
                key: 'Access-Control-Allow-Methods',
                value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT'
              },
              {
                key: 'Access-Control-Allow-Headers',
                value:
                  'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
              }
              // 安全头部 相关配置，谨慎开启
              //   { key: 'X-Frame-Options', value: 'DENY' },
              //   { key: 'X-Content-Type-Options', value: 'nosniff' },
              //   { key: 'X-XSS-Protection', value: '1; mode=block' },
              //   { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
              //   { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
              //   {
              //     key: 'Strict-Transport-Security',
              //     value: 'max-age=31536000; includeSubDomains; preload'
              //   },
              //   {
              //     key: 'Content-Security-Policy',
              //     value: [
              //       "default-src 'self'",
              //       "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.googleapis.com *.gstatic.com *.google-analytics.com *.googletagmanager.com",
              //       "style-src 'self' 'unsafe-inline' *.googleapis.com *.gstatic.com",
              //       "img-src 'self' data: blob: *.notion.so *.unsplash.com *.githubusercontent.com *.gravatar.com",
              //       "font-src 'self' *.googleapis.com *.gstatic.com",
              //       "connect-src 'self' *.google-analytics.com *.googletagmanager.com",
              //       "frame-src 'self' *.youtube.com *.vimeo.com",
              //       "object-src 'none'",
              //       "base-uri 'self'",
              //       "form-action 'self'"
              //     ].join('; ')
              //   },

              //   // CORS 配置（更严格）
              //   { key: 'Access-Control-Allow-Credentials', value: 'false' },
              //   {
              //     key: 'Access-Control-Allow-Origin',
              //     value: process.env.NODE_ENV === 'production'
              //       ? siteConfig('LINK') || 'https://yourdomain.com'
              //       : '*'
              //   },
              //   { key: 'Access-Control-Max-Age', value: '86400' }
            ]
          }
          //   {
          //     source: '/api/:path*',
          //     headers: [
          //       // API 特定的安全头部
          //       { key: 'X-Frame-Options', value: 'DENY' },
          //       { key: 'X-Content-Type-Options', value: 'nosniff' },
          //       { key: 'Cache-Control', value: 'no-store, max-age=0' },
          //       {
          //         key: 'Access-Control-Allow-Methods',
          //         value: 'GET,POST,PUT,DELETE,OPTIONS'
          //       }
          //     ]
          //   }
        ]
      },
  webpack: (config, { dev, isServer }) => {
    // 动态主题：添加 resolve.alias 配置，将动态路径映射到实际路径
    config.resolve.alias['@'] = path.resolve(__dirname)

    if (!isServer) {
      console.log('[默认主题]', path.resolve(__dirname, 'themes', THEME))
    }
    config.resolve.alias['@theme-components'] = path.resolve(
      __dirname,
      'themes',
      THEME
    )

    // 添加 statoscope 包分析
    if (process.env.ANALYZE) {
      const StatoscopeWebpackPlugin =
        require('@statoscope/webpack-plugin').default
      config.plugins.push(new StatoscopeWebpackPlugin())
    }

    return config
  },
  experimental: {
    scrollRestoration: true,
    // 性能优化实验性功能
    optimizePackageImports: ['@heroicons/react', 'lodash']
  },
  exportPathMap: function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    // export 静态导出时 忽略/pages/sitemap.xml.js ， 否则和getServerSideProps这个动态文件冲突
    const pages = { ...defaultPathMap }
    delete pages['/sitemap.xml']
    delete pages['/auth']
    return pages
  },
  publicRuntimeConfig: {
    // 这里的配置既可以服务端获取到，也可以在浏览器端获取到
    THEMES: themes
  }
}

module.exports = process.env.ANALYZE
  ? withBundleAnalyzer(nextConfig)
  : nextConfig
