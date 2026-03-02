import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { generateRssData, rssCacheHead } from '@/lib/utils/rss'

export async function getServerSideProps(ctx) {
  const from = 'rss-atom-xml-props'
  const { locale } = ctx.req
  const globalData = await fetchGlobalAllData({ from, locale })
  const rssData = await generateRssData(globalData)
  ctx.res.setHeader('Cache-Control', rssCacheHead)
  ctx.res.setHeader('Content-Type', 'text/xml')
  ctx.res.write(rssData.atom1()) // 直接返回内容
  ctx.res.end()
  return { props: {} }
}

export default function rssAtomXml() {}