import { isBrowser } from '@/lib/utils'
import BLOG from '@/blog.config'
import getAllViewPageIds from '@/lib/notion/getAllViewPageIds'

export function GalleryBeautification(post) {
  // 当前页面
  const currentPageId = post.id
  const currentPageContent = post.blockMap.block[currentPageId].value.content
  // 查找当前页面下的第一个表格id
  const tableId = currentPageContent?.find(contentId => {
    return post.blockMap.block[contentId].value?.type === 'collection_view'
  })
  if (!tableId) {
    console.warn('[Notion]未找到表格数据', post.blockMap.block[currentPageId], post.blockMap.block[currentPageId].value)
    return
  }
  // 获取表格数据
  const databaseRecordMap = post.blockMap.block[tableId]
  const rawMetadata = databaseRecordMap.value
  // Check Type Page-Database和Inline-Database
  if (rawMetadata?.type !== 'collection_view_page' && rawMetadata?.type !== 'collection_view') {
    console.error(`pageId "${tableId}" is not a database`)
    return
  }
  //   console.log('表格', databaseRecordMap, block, rawMetadata)
  // 获取表格的Collection数据
  const collectionId = rawMetadata?.collection_id
  const collection = post.blockMap.collection[collectionId]?.value
  const schema = collection?.schema
  // 所有Block/CollectionQuery/allCollectionView
  const allBlock = post.blockMap.block || {}
  const allCollectionQuery = post.blockMap.collection_query
  const allCollectionView = post.blockMap.collection_view
  // 获取表格的viewIds数据
  const galleryViewIds = rawMetadata?.view_ids.filter((viewId) => {
    return allCollectionView[viewId].value.type === 'gallery'
  })
  let urlColumnKey, urlColumnIndex
  // 获取所有页面Id
  const pageIds = getAllViewPageIds(allCollectionQuery, collectionId, allCollectionView, galleryViewIds)
  if (pageIds?.length === 0) {
    console.warn('[Notion配置]获取到的数据库列表为空，请检查notion页面', allCollectionQuery, collection, allCollectionView, galleryViewIds, databaseRecordMap)
    return
  }
  // 获取字段所在列
  const galleryViewColumnIndexDict = {}
  for (let i = 0; i < galleryViewIds.length; i++) {
    const galleryProperties = allCollectionView[galleryViewIds[i]]?.value.format.gallery_properties || []
    const descriptionColumnIndex = getDescriptionColumnIndex(galleryProperties, schema) || -1;
    [urlColumnKey, urlColumnIndex] = getUrlColumnIndex(galleryProperties, schema) || ['', -1]
    galleryViewColumnIndexDict[i] = [descriptionColumnIndex, urlColumnIndex]
  }
  if (!urlColumnKey) {
    urlColumnKey = getUrlColumnKey(schema)
  }
  addIcon(allBlock, pageIds, urlColumnKey)
  // 将相册gallery超链接进行修改
  if (isBrowser) {
    const collectionViewObserver = new MutationObserver(() => {
      setHrefUrls(galleryViewColumnIndexDict)
    })
    const notionArticleObserver = new MutationObserver((changedNodes) => {
      if (document.getElementById('notion-article')?.querySelectorAll('.notion-collection-card-body')[0]) {
        setHrefUrls(galleryViewColumnIndexDict)
        collectionViewObserver.observe(document.getElementById('notion-article').querySelectorAll('.notion-collection-view-tabs-content-item')[0], {
          attributes: true
        })
        notionArticleObserver.disconnect()
      }
    })
    notionArticleObserver.observe(document.body, { childList: true, subtree: true })
  }
}

/**
 * 获取激活的View所在列
 */
function getActivatedViewIndex() {
  const activatedViewList = document.getElementById('notion-article')?.querySelectorAll('.notion-collection-view-tabs-content-item')
  for (let i = 0; i < activatedViewList.length; i++) {
    if (activatedViewList[i].classList.contains('notion-collection-view-tabs-content-item-active')) {
      return i
    }
  }
}

/**
 * 设置点击跳转和样式处理
 */
function setHrefUrls(galleryViewColumnIndexDict) {
  const activatedViewIndex = getActivatedViewIndex()
  let [descriptionColumnIndex, urlColumnIndex] = galleryViewColumnIndexDict[activatedViewIndex]
  // console.log(descriptionColumnIndex, urlColumnIndex)
  if (!descriptionColumnIndex || !urlColumnIndex) {
    return
  }
  const collectionCardBodyList = document.getElementById('notion-article')?.querySelectorAll('.notion-collection-card-body')
  const offset = descriptionColumnIndex < urlColumnIndex ? -1 : 0
  urlColumnIndex += offset
  for (const collectionCardBody of collectionCardBodyList) {
    const children = collectionCardBody.children
    children[descriptionColumnIndex]?.classList.add('notion-page-description-text')
    // 将描述插入到标题中
    if (children[descriptionColumnIndex]) {
      children[0].firstElementChild.firstElementChild.firstElementChild.appendChild(children[descriptionColumnIndex])
    }
    // 将网址设置为跳转链接，并删除原始网址
    let urlText = (children[urlColumnIndex].textContent || children[urlColumnIndex]?.firstElementChild?.firstElementChild?.action)
    urlText = urlText.indexOf('http') === -1 ? 'https://' + urlText : urlText
    const linkElement = collectionCardBody.parentElement
    linkElement.setAttribute('target', '_blank')
    linkElement.setAttribute('href', urlText)
    children[urlColumnIndex].remove()
  }
}

/**
 * 根据数据中的url为其添加图标（如果已设置，则不做处理）
 * @param {{}} allBlock
 * @param {*} pageIds
 * @param {*} urlColumnKey
 */
function addIcon(allBlock, pageIds, urlColumnKey) {
  if (!urlColumnKey) {
    return
  }
  // 遍历用户的表格
  for (const pageId of pageIds) {
    // 数据库一行的值
    const value = allBlock[pageId]?.value
    if (!value) {
      continue
    }
    const val = value?.properties[urlColumnKey]
    const urlColumnValue = val?.[0]?.[0]
    if (!allBlock[pageId].value.format?.page_icon) {
      allBlock[pageId].value.format = {
        page_icon: 'https://www.google.com/s2/favicons?sz=48&domain=' + urlColumnValue
      }
    }
  }
}

/**
 * 获取description所在列
 * @param {Array<{property: PropertyID; visible: boolean}>} galleryProperties
 * @param {*} schema 将属性映射为真实属性值
 */
function getDescriptionColumnIndex(galleryProperties, schema) {
  for (let i = 0; i < galleryProperties.length; i++) {
    const key = galleryProperties[i].property
    if (BLOG.NOTION_PROPERTY_NAME.description.indexOf(schema?.[key]?.name) !== -1) {
      return i
    }
  }
}

/**
 * 获取url所在列
 * @param {Array<{property: PropertyID; visible: boolean}>} galleryProperties
 * @param {*} schema 将属性映射为真实属性值
 */
function getUrlColumnIndex(galleryProperties, schema) {
  for (let i = 0; i < galleryProperties.length; i++) {
    const key = galleryProperties[i].property
    // 多条件检测是否为网址列
    if (BLOG.NOTION_PROPERTY_NAME.url.indexOf(schema?.[key]?.name) !== -1 || schema?.[key]?.name.toLowerCase().includes(BLOG.NOTION_PROPERTY_NAME.url) || schema?.[key]?.type === 'url') {
      return [key, i]
    }
  }
}

/**
 * 获取url的属性键
 * @param {Array<{property: PropertyID; visible: boolean}>} galleryProperties
 * @param {*} schema 将属性映射为真实属性值
 */
function getUrlColumnKey(schema) {
  const schemaList = Object.entries(schema)
  for (const schema of schemaList) {
    const [key, value] = schema
    // 多条件检测是否为网址列
    if (BLOG.NOTION_PROPERTY_NAME.url.indexOf(value?.name) !== -1 || value?.name.toLowerCase().includes(BLOG.NOTION_PROPERTY_NAME.url) || value?.type === 'url') {
      return key
    }
  }
}
