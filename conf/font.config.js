/**
 * 网站字体相关配置
 *
 */
module.exports = {
  // START ************网站字体*****************
  // ['font-serif','font-sans'] 两种可选，分别是衬线和无衬线: 参考 https://www.jianshu.com/p/55e410bd2115
  // 后面空格隔开的font-light的字体粗细，留空是默认粗细；参考 https://www.tailwindcss.cn/docs/font-weight
  FONT_STYLE: process.env.NEXT_PUBLIC_FONT_STYLE || 'font-sans',
  // 字体CSS 例如 https://npm.elemecdn.com/lxgw-wenkai-webfont@1.6.0/style.css
  FONT_URL: [
    // 'https://npm.elemecdn.com/lxgw-wenkai-webfont@1.6.0/style.css',
    // 'https://fonts.googleapis.com/css?family=Bitter&display=swap',
    // 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300&display=swap',
    // 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300&display=swap'
  ],
  // 无衬线字体 例如'"LXGW WenKai"'
  FONT_SANS: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Noto Sans',
    'Helvetica',
    'Arial',
    'sans-serif',
    'Apple Color Emoji',
    'Segoe UI Emoji'
  ],
  // 衬线字体 例如'"LXGW WenKai"'
  FONT_SERIF: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Noto Sans',
    'Helvetica',
    'Arial',
    'sans-serif',
    'Apple Color Emoji',
    'Segoe UI Emoji'
  ],
  FONT_AWESOME:
    process.env.NEXT_PUBLIC_FONT_AWESOME_PATH ||
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css' // font-awesome 字体图标地址; 可选 /css/all.min.css ， https://lf9-cdn-tos.bytecdntp.com/cdn/expire-1-M/font-awesome/6.0.0/css/all.min.css

  // END ************网站字体*****************
}
