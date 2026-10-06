import { processPostData } from '@/lib/utils/post'

jest.mock('notion-utils', () => ({
  getTextContent: text => (text || []).map(item => item[0]).join('')
}))

jest.mock('@/blog.config', () => ({
  LINK: 'https://example.com',
  AUTHOR: 'Author'
}))
jest.mock('@/lib/config', () => ({ siteConfig: (key, fallback) => fallback }))
jest.mock('@/lib/utils', () => ({ isHttpLink: () => false }))
jest.mock('@/lib/plugins/algolia', () => ({ uploadDataToAlgolia: jest.fn() }))
jest.mock('@/lib/cache/cache_manager', () => ({
  getDataFromCache: jest.fn(),
  setDataToCache: jest.fn()
}))
jest.mock('@/lib/plugins/aiSummary', () => ({ getAiSummary: jest.fn() }))
jest.mock('@/lib/utils/originalityProof', () => ({
  createOriginalityProof: () => null,
  applyOriginalityProofRecord: () => null,
  isOriginalityProofEnabled: () => false
}))

test('processing a post preserves its heading text and IDs with the upstream TOC API', async () => {
  const post = {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Post',
    slug: 'post',
    blockMap: {
      block: {
        heading: {
          value: {
            id: 'heading',
            parent_id: '11111111-1111-4111-8111-111111111111',
            type: 'header',
            properties: { title: [['Heading']] }
          }
        }
      }
    }
  }
  await processPostData({ post })
  expect(post.toc).toEqual([
    { id: 'heading', type: 'header', text: 'Heading', indentLevel: 0 }
  ])
})
