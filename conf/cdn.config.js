/**
 * CDN地址统一插件
 */
module.exports = {
  CDN_PRECONNECT: process.env.NEXT_PUBLIC_CDN_PRECONNECT || [], // 是否开启CDN预连接
  CDN_TRANSFORM: process.env.NEXT_PUBLIC_CDN_TRANSFORM || false, // 是否开启CDN地址转换
  // 统一的 NPM 资源CDN地址，例如：https://registry.npmmirror.com/
  NPM_CDN_BASE:
    process.env.NEXT_PUBLIC_NPM_CDN_BASE || 'https://registry.npmjs.org/',
  // 统一的 CDNJS 资源CDN地址，例如：https://s4.zstatic.net/
  CDNJS_CDN_BASE:
    process.env.NEXT_PUBLIC_CDNJS_CDN_BASE || 'https://cdnjs.cloudflare.com/',
  // 统一的 JSDELIVR 资源CDN地址，例如：https://cdn.jsdmirror.com/
  JSDELIVR_CDN_BASE:
    process.env.NEXT_PUBLIC_JSDELIVR_CDN_BASE || 'https://cdn.jsdelivr.net/'
}
