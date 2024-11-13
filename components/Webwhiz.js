import { siteConfig } from '@/lib/config'
import ExternalScript from './ExternalScript'

/**
 * 一个开源ai组件
 * @see https://github.com/webwhiz-ai/webwhiz
 * @returns
 */
export default function WebWhiz() {
  const props = {
    id: '__webwhizSdk__',
    src: 'https://cdn.jsdelivr.net/npm/webwhiz@1.0.0/dist/sdk.min.js',
    baseUrl: siteConfig('WEB_WHIZ_BASE_URL'),
    chatbotId: siteConfig('WEB_WHIZ_CHAT_BOT_ID')
  }
  return <ExternalScript {...props}/>
}
