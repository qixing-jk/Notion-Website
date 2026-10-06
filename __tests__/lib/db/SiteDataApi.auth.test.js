/** @jest-environment node */
import { isSerializableProps } from 'next/dist/lib/is-serializable-props'
import { cleanDataBeforeReturn, fetchGlobalAllData } from '@/lib/db/SiteDataApi'

jest.mock('@/lib/db/notion/getNotionPost', () => ({
  fetchPageFromNotion: jest.fn()
}))
jest.mock('@/lib/db/notion/getNotionAPI', () => ({}))
jest.mock('p-limit', () => () => fn => fn())
jest.mock('notion-utils', () => ({}))

test('custom auth page props remain serializable without a post', () => {
  const props = { allPages: [], latestPosts: [] }
  cleanDataBeforeReturn(props)
  expect(() =>
    isSerializableProps('/auth/result', 'getStaticProps', props)
  ).not.toThrow()
  expect(props).not.toHaveProperty('allPages')
})

jest.mock('@/lib/cache/cache_manager', () => ({
  getOrSetDataWithCache: jest.fn((key, fetchData) => fetchData())
}))
jest.mock('@/lib/db/notion/getPostBlocks', () => ({
  fetchNotionPageBlocks: jest.fn(async () => null)
}))

test('rejects unavailable site data instead of publishing a cached error homepage', async () => {
  await expect(
    fetchGlobalAllData({
      pageId: '059fddb2b6964c199485672f6dbeda49',
      from: 'test'
    })
  ).rejects.toThrow('Notion')
})
