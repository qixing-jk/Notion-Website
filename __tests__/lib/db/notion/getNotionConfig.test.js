jest.mock('@/lib/db/notion/getPostBlocks', () => ({
  fetchNotionPageBlocks: jest.fn()
}))
jest.mock('@/lib/plugins/mailEncrypt', () => ({
  encryptEmail: jest.fn(value => value)
}))
jest.mock('notion-utils', () => ({
  getDateValue: jest.fn(),
  getTextContent: jest.fn(value => value?.[0]?.[0] || '')
}))

import {
  findConfigPage,
  parseConfigFromPage
} from '@/lib/db/notion/getNotionConfig'

describe('parseConfigFromPage', () => {
  it.each(['collection_view', 'collection_view_page'])(
    'reads config from a %s database block',
    type => {
      const recordMap = {
        block: {
          table: {
            value: {
              id: 'table',
              type,
              collection_id: 'collection',
              view_ids: ['view']
            }
          },
          row: {
            value: {
              id: 'row',
              properties: {
                key: [['AUTHOR']],
                value: [['Example Author']],
                enable: [['Yes']]
              }
            }
          }
        },
        collection: {
          collection: {
            value: {
              schema: {
                key: { name: '配置名', type: 'title' },
                value: { name: '配置值', type: 'text' },
                enable: { name: '启用', type: 'text' }
              }
            }
          }
        },
        collection_query: {
          collection: {
            view: {
              blockIds: ['row']
            }
          }
        },
        collection_view: {}
      }

      expect(parseConfigFromPage(recordMap, ['table'])).toEqual({
        AUTHOR: 'Example Author'
      })
    }
  )
})

describe('findConfigPage', () => {
  it('prefers a published config page over an unpublished draft', () => {
    const draft = { id: 'draft', type: 'CONFIG', status: 'Invisible' }
    const published = { id: 'live', type: 'CONFIG', status: 'Published' }
    expect(findConfigPage([draft, published])).toBe(published)
  })
  it('keeps the existing fallback when no config page is published', () => {
    const draft = { id: 'draft', type: 'CONFIG', status: 'Invisible' }
    expect(findConfigPage([draft])).toBe(draft)
  })
})
