// eslint-disable-next-line @next/next/no-document-import-in-page
import Document, { Head, Html, Main, NextScript } from 'next/document'

// 预先设置深色模式的脚本内容
// const darkModeScript = `
// (function() {
//   const darkMode = localStorage.getItem('darkMode')
//
//   const prefersDark =
//     window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
//
//   const defaultAppearance = '${BLOG.APPEARANCE || 'auto'}'
//
//   let shouldBeDark = darkMode === 'true' || darkMode === 'dark'
//
//   if (darkMode === null) {
//     if (defaultAppearance === 'dark') {
//       shouldBeDark = true
//     } else if (defaultAppearance === 'auto') {
//       // 检查是否在深色模式时间范围内
//       const date = new Date()
//       const hours = date.getHours()
//       const darkTimeStart = ${BLOG.APPEARANCE_DARK_TIME ? BLOG.APPEARANCE_DARK_TIME[0] : 18}
//       const darkTimeEnd = ${BLOG.APPEARANCE_DARK_TIME ? BLOG.APPEARANCE_DARK_TIME[1] : 6}
//
//       shouldBeDark = prefersDark || (hours >= darkTimeStart || hours < darkTimeEnd)
//     }
//   }
//
//   // 立即设置 html 元素的类
//   document.documentElement.classList.add(shouldBeDark ? 'dark' : 'light')
// })()
// `

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    return (
      <Html>
        <Head>
          <link
            rel='apple-touch-icon'
            sizes='180x180'
            href='/apple-touch-icon.png'
          />
          <link
            rel='icon'
            type='image/png'
            sizes='32x32'
            href='/favicon-32x32.png'
          />
          <link
            rel='icon'
            type='image/png'
            sizes='16x16'
            href='/favicon-16x16.png'
          />
          <link rel='manifest' href='/site.webmanifest' />
          <link rel='mask-icon' href='/safari-pinned-tab.svg' color='#5bbad5' />
          <meta name='msapplication-TileColor' content='#da532c' />
          <meta name='theme-color' content='#ffffff' />
          {/* 预先设置深色模式，避免闪烁 */}
          {/*<script dangerouslySetInnerHTML={{ __html: darkModeScript }} />*/}
        </Head>

        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
