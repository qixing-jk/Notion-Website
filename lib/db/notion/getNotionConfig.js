/**
 * 从Notion中读取站点配置;
 * 在Notion模板中创建一个类型为CONFIG的页面，再添加一个数据库表格，即可用于填写配置
 * Notion数据库配置优先级最高，将覆盖vercel环境变量以及blog.config.js中的配置
 * --注意--
 * 数据库请从模板复制 https://www.notion.so/tanghh/287869a92e3d4d598cf366bd6994755e
 *
 */
import { getDateValue, getTextContent } from 'notion-utils'
import BLOG from '@/blog.config'
import { deepClone } from '../../utils'
import { fetchNotionPageBlocks } from './getPostBlocks'
import { encryptEmail } from '@/lib/plugins/mailEncrypt'
import { normalizeCollection, normalizePageBlock, normalizeSchema } from './normalizeUtil'

const shouldTraceConfigSelection =
  process.env.BUILD_MODE === 'true' ||
  process.env.DEBUG_CONFIG_TRACE === 'true'

function traceConfigSelection(...args) {
  if (shouldTraceConfigSelection) {
    console.log('[Notion配置][Trace]', ...args)
  }
}

function getTargetViewId(viewIds) {
  if (!Array.isArray(viewIds) || viewIds.length === 0) {
    return null
  }

  return viewIds[BLOG.NOTION_INDEX || 0] || viewIds[0]
}

function getPageIdsFromCurrentView(collectionQuery, collectionId, collectionView, viewIds) {
  const pageSet = new Set()
  const targetViewId = getTargetViewId(viewIds)

  if (!targetViewId) {
    return []
  }

  const pageSort = collectionView?.[targetViewId]?.value?.value?.page_sort
  if (Array.isArray(pageSort) && pageSort.length > 0) {
    pageSort.forEach(id => pageSet.add(id))
  }

  const viewQuery = collectionQuery?.[collectionId]?.[targetViewId]
  ;[
    viewQuery?.collection_group_results?.blockIds,
    viewQuery?.results?.blockIds,
    viewQuery?.blockIds
  ].forEach(ids => {
    if (Array.isArray(ids)) {
      ids.forEach(id => pageSet.add(id))
    }
  })

  return [...pageSet]
}

/**
 * 从Notion中读取Config配置表
 * @param {*} allPages
 * @returns
 */
export async function getConfigMapFromConfigPage(allPages) {
  // 默认返回配置文件
  const notionConfig = {}

  if (!allPages || !Array.isArray(allPages) || allPages.length === 0) {
    console.warn('[Notion配置] 忽略的配置')
    return null
  }
  const configCandidates =
    allPages?.filter(post => {
      return (
        post &&
        post?.type &&
        (post?.type === 'CONFIG' ||
          post?.type === 'config' ||
          post?.type === 'Config')
      )
    }) || []

  traceConfigSelection(
    'Config 页面候选',
    configCandidates.map(post => ({
      id: post.id,
      title: post.title,
      status: post.status,
      slug: post.slug,
      type: post.type
    }))
  )

  // 找到Config类
  const configPage =
    configCandidates.find(post => post?.status === 'Published') ||
    configCandidates[0]

  if (!configPage) {
    // console.warn('[Notion配置] 未找到配置页面')
    return null
  }
  const configPageId = configPage.id
  traceConfigSelection('命中的 Config 页面', {
    id: configPage.id,
    title: configPage.title,
    status: configPage.status,
    slug: configPage.slug,
    type: configPage.type
  })
  //   console.log('[Notion配置]请求配置数据 ', configPage.id)
  let pageRecordMap = await fetchNotionPageBlocks(configPageId, 'config-table')
  //   console.log('配置中心Page', configPageId, pageRecordMap)
  let content = normalizePageBlock(pageRecordMap.block[configPageId].value)?.content
  for (const table of ['Config-Table', 'CONFIG-TABLE']) {
    if (content) break
    pageRecordMap = await fetchNotionPageBlocks(configPageId, table)
    content = pageRecordMap.block[configPageId]?.value?.content
  }

  if (!content) {
    // console.warn(
    //   '[Notion配置] 未找到配置表格',
    //   pageRecordMap.block[configPageId],
    //   pageRecordMap.block[configPageId].value
    // )
    return null
  }

  // 找到PAGE文件中的database
  const configTableId = content?.find(contentId => {
    return normalizePageBlock(pageRecordMap.block[contentId].value)?.type === 'collection_view'
  })

  // eslint-disable-next-line no-constant-condition, no-self-compare
  if (!configTableId) {
    // console.warn(
    //   '[Notion配置]未找到配置表格数据',
    //   pageRecordMap.block[configPageId],
    //   pageRecordMap.block[configPageId].value
    // )
    return null
  }

  // 页内查找数据表格
  const block = pageRecordMap.block || {}
  const rawMetadata = normalizePageBlock(pageRecordMap.block[configTableId])
  // Check Type Page-Database和Inline-Database
  if (
    rawMetadata?.type !== 'collection_view_page' &&
    rawMetadata?.type !== 'collection_view'
  ) {
    console.error(`pageId "${configTableId}" is not a database`)
    return null
  }
  const collectionId = rawMetadata?.collection_id
  const collection = normalizeCollection(pageRecordMap.collection[collectionId].value)
  const collectionQuery = pageRecordMap.collection_query
  const collectionView = pageRecordMap.collection_view
  const schema = normalizeSchema(collection?.schema || {})
  const viewIds = rawMetadata?.view_ids
  const targetViewId = getTargetViewId(viewIds)
  traceConfigSelection('命中的配置表', {
    configPageId,
    configTableId,
    collectionId,
    collectionName: collection?.name,
    targetViewId
  })
  const pageIds = getPageIdsFromCurrentView(
    collectionQuery,
    collectionId,
    collectionView,
    viewIds
  )
  if (pageIds?.length === 0) {
    console.error(
      '[Notion配置]获取到的文章列表为空，请检查notion模板',
      collectionQuery,
      collection,
      collectionView,
      viewIds,
      databaseRecordMap
    )
  }
  const interestingConfigRows = []

  // 遍历用户的表格
  for (let i = 0; i < pageIds.length; i++) {
    const id = pageIds[i]
    const value = block[id]?.value
    if (!value) {
      continue
    }
    const temp = normalizePageBlock(block?.[id]?.value)
    if(!temp?.properties){
      continue
    }
    const rawProperties = Object.entries(temp?.properties || [])
    const excludeProperties = ['date', 'select', 'multi_select', 'person']
    const properties = {}
    for (let i = 0; i < rawProperties.length; i++) {
      const [key, val] = rawProperties[i]
      properties.id = id
      if (schema[key]?.type && !excludeProperties.includes(schema[key].type)) {
        properties[schema[key].name] = getTextContent(val)
      } else {
        switch (schema[key]?.type) {
          case 'date': {
            const dateProperty = getDateValue(val)
            delete dateProperty.type
            properties[schema[key].name] = dateProperty
            break
          }
          case 'select':
          case 'multi_select': {
            const selects = getTextContent(val)
            if (selects[0]?.length) {
              properties[schema[key].name] = selects.split(',')
            }
            break
          }
          default:
            break
        }
      }
    }

    if (properties && typeof properties === 'object' && !Array.isArray(properties) && Object.keys(properties).length > 0) {
      // 将表格中的字段映射成 英文
      const config = {
        enable: (properties['启用'] || properties.Enable) === 'Yes',
        key: properties['配置名'] || properties.Name,
        value: properties['配置值'] || properties.Value
      }

      if (
        typeof config.key === 'string' &&
        ['THEME', 'INLINE_CONFIG', 'TITLE', 'LANG', 'LINK'].includes(config.key)
      ) {
        interestingConfigRows.push({
          id,
          key: config.key,
          enable: config.enable,
          value:
            typeof config.value === 'string'
              ? config.value.slice(0, 300)
              : config.value
        })
      }

      // 只导入生效的配置
      if (config.enable) {
        // console.log('[Notion配置]', config.key, config.value)
        if (config.key === 'CONTACT_EMAIL') {
          notionConfig[config.key] =
            (config.value && encryptEmail(config.value)) || null
        } else {
          notionConfig[config.key] =
            parseTextToJson(config.value) || config.value || null
          // 配置不能是undefined，至少是null
        }
      }
    }
  }

  traceConfigSelection('关键配置行', interestingConfigRows)

  let combine = notionConfig
  try {
    // 将INLINE_CONFIG合并，@see https://docs.tangly1024.com/article/notion-next-inline-config
    combine = Object.assign(
      {},
      deepClone(notionConfig),
      notionConfig?.INLINE_CONFIG
    )
  } catch (err) {
    console.warn('解析 INLINE_CONFIG 配置时出错,请检查JSON格式', err)
  }
  traceConfigSelection('最终主题解析', {
    theme: combine?.THEME ?? null,
    inlineTheme: combine?.INLINE_CONFIG?.THEME ?? null,
    keys: Object.keys(combine || {}).filter(key =>
      ['THEME', 'INLINE_CONFIG', 'TITLE', 'LANG', 'LINK'].includes(key)
    )
  })
  return combine
}

/**
 * 解析INLINE_CONFIG
 * @param {*} configString
 * @returns
 */
export function parseConfig(configString) {
  if (!configString) {
    return {}
  }
  // 解析对象
  try {
    // eslint-disable-next-line no-eval
    const config = eval('(' + configString + ')')
    return config
  } catch (evalError) {
    console.warn(
      '解析 eval(INLINE_CONFIG) 配置时出错,请检查JSON格式',
      evalError
    )
    return {}
  }
}

/**
 * 解析文本为JSON
 * @param text
 * @returns {any|null}
 */
export function parseTextToJson(text) {
  try {
    return JSON.parse(text)
  } catch (error) {
    return null
  }
}
