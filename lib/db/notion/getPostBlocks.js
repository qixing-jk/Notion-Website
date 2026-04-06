import {
  getDataFromCache,
  getOrSetDataWithCache
} from '@/lib/cache/cache_manager'
import { deepClone, delay } from '../../utils'
import notionAPI from '@/lib/db/notion/getNotionAPI'
import pLimit from 'p-limit'

const limit = pLimit(15)
const REQUEST_INTERVAL = 50 // ms

/**
 * 获取文章内容块
 * @param {string} id
 * @param {*} from
 */
export async function fetchNotionPageBlocks(id, from = null) {
  const cacheKey = `page_block_${id}`

  const pageBlock = await getOrSetDataWithCache(
    cacheKey,
    async () => limit(() => getPageWithRetry(id, from))
  )

  if (!pageBlock) {
    console.warn('[getPage] empty pageBlock:', id)
    return null
  }

  return pageBlock
}

/**
 * 通过 react-notion-x 下的 notion-client 调用 Notion 接口，失败会重试
 * @param {*} id
 * @param {*} retryAttempts
 */
export async function getPageWithRetry(id, from, retryAttempts = 3) {
  if (retryAttempts && retryAttempts > 0) {
    console.log(
      '[API-->>请求]',
      `from:${from}`,
      `id:${id}`,
      retryAttempts < 3 ? `剩余重试次数:${retryAttempts}` : ''
    )

    try {
      const start = Date.now()
      const pageData = await notionAPI.getPage(id)
      const end = Date.now()
      console.log('[API<<--响应]', `耗时:${end - start}ms - from:${from}`)
      return pageData
    } catch (e) {
      console.warn('[API<<--异常]:', e)
      await delay(1000)

      const cacheKey = 'page_block_' + id
      const pageBlock = await getDataFromCache(cacheKey)
      if (pageBlock) {
        console.log('[重试缓存]', `from:${from}`, `id:${id}`)
        return pageBlock
      }

      return getPageWithRetry(id, from, retryAttempts - 1)
    }
  }

  console.error('[请求失败]:', `from:${from}`, `id:${id}`)
  return null
}

/**
 * Notion页面BLOCK格式化处理
 * 1.删除冗余字段
 * 2.比如文件、视频、音频、url格式化
 * 3.代码块等元素兼容
 * @param {*} id 页面ID
 * @param {*} blockMap 页面元素
 * @param {*} slice 截取数量
 * @returns
 */
export function formatNotionBlock(block) {
  const clonedBlock = deepClone(block)
  const blocksToProcess = Object.keys(clonedBlock || {})

  for (let i = 0; i < blocksToProcess.length;) {
    const blockId = blocksToProcess[i]
    let b = clonedBlock[blockId]

    if (b?.value?.value?.id) {
      clonedBlock[blockId] = { value: b.value.value }
      b = clonedBlock[blockId]
    } else if (!b?.value?.id && b?.value?.role !== undefined) {
      i++
      continue
    }

    if (b?.value) {
      delete b.value.crdt_data
      delete b.value.crdt_format_version
    }

    sanitizeBlockUrls(b?.value)

    if (b?.value?.type === 'sync_block' && b?.value?.children) {
      const childBlocks = b.value.children
      const childBlockIds = []
      delete clonedBlock[blockId]
      childBlocks.forEach((childBlock, index) => {
        const newBlockId = `${blockId}_child_${index}`
        clonedBlock[newBlockId] = childBlock
        childBlockIds.push(newBlockId)
      })
      blocksToProcess.splice(i, 1, ...childBlockIds)
      continue
    }

    if (b?.value?.type === 'code') {
      if (b?.value?.properties?.language?.[0][0] === 'C++') {
        b.value.properties.language[0][0] = 'cpp'
      }
      if (b?.value?.properties?.language?.[0][0] === 'C#') {
        b.value.properties.language[0][0] = 'csharp'
      }
      if (b?.value?.properties?.language?.[0][0] === 'Assembly') {
        b.value.properties.language[0][0] = 'asm6502'
      }
    }

    if (
      ['file', 'pdf', 'video', 'audio'].includes(b?.value?.type) &&
      b?.value?.properties?.source?.[0][0] &&
      (b?.value?.properties?.source?.[0][0]?.startsWith('attachment') ||
        b?.value?.properties?.source?.[0][0].indexOf('amazonaws.com') > 0)
    ) {
      const oldUrl = b?.value?.properties?.source?.[0][0]
      const newUrl = `https://notion.so/signed/${encodeURIComponent(oldUrl)}?table=block&id=${b?.value?.id}`
      b.value.properties.source[0][0] = newUrl
    }

    i++
  }

  return clonedBlock
}

/**
 * 根据[]ids，批量抓取blocks
 * 在获取数据库文章列表时，超过一定数量的block会被丢弃，因此根据pageId批量抓取block
 * @param {*} ids
 * @param {*} batchSize
 * @returns
 */
export const fetchInBatches = async (ids, batchSize = 30) => {
  if (!ids || (Array.isArray(ids) && ids.length === 0)) {
    return {}
  }

  if (!Array.isArray(ids)) {
    ids = [ids]
  }

  let fetchedBlocks = {}

  console.log('[Batch] START total ids:', ids.length)

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize)

    console.log(`\n[Batch] processing ${i} ~ ${i + batch.length}`)

    try {
      const result = await limit(async () => {
        await delay(REQUEST_INTERVAL)
        console.log('[API-->>批量请求]', batch.length)

        const start = Date.now()
        const pageChunk = await notionAPI.getBlocks(batch)
        const end = Date.now()
        const blocks = pageChunk?.recordMap?.block || {}

        console.log(
          `[API<<--批量响应] size:${batch.length} 耗时:${end - start}ms blocks:${Object.keys(blocks).length}`
        )

        return blocks
      })

      fetchedBlocks = {
        ...fetchedBlocks,
        ...result
      }
    } catch (err) {
      console.warn('[Batch API异常]', err.message)
    }
  }

  return fetchedBlocks
}

/**
 * 强制修复 block 中所有可能的非法 URL 字段
 * @param {Object} blockValue - block.value
 */
function sanitizeBlockUrls(blockValue) {
  if (!blockValue || typeof blockValue !== 'object') return

  const fixUrl = url => {
    if (typeof url !== 'string') return url

    if (url.startsWith('/')) {
      return url
    }

    // 修复 http:xxx → http://xxx
    if (url.startsWith('http:') && !url.startsWith('http://')) {
      url = 'http://' + url.slice(5)
    } else if (url.startsWith('https:') && !url.startsWith('https://')) {
      url = 'https://' + url.slice(6)
    }

    // 再次验证是否合法，否则替换为占位图
    try {
      new URL(url)
      return url
    } catch {
      console.warn('[Sanitize URL] Invalid URL replaced:', url)
      return 'https://via.placeholder.com/1x1?text=Invalid+Image'
    }
  }

  // 1. 处理 properties.source（用于 image, embed, bookmark, file, pdf 等）
  if (
    blockValue.properties?.source?.[0]?.[0] &&
    typeof blockValue.properties.source[0][0] === 'string'
  ) {
    blockValue.properties.source[0][0] = fixUrl(
      blockValue.properties.source[0][0]
    )
  }

  if (blockValue.file?.url && typeof blockValue.file.url === 'string') {
    blockValue.file.url = fixUrl(blockValue.file.url)
  }

  if (
    blockValue.format?.page_cover &&
    typeof blockValue.format.page_cover === 'string'
  ) {
    blockValue.format.page_cover = fixUrl(blockValue.format.page_cover)
  }
}
