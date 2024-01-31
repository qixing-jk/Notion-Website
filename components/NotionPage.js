import dynamic from 'next/dynamic'
import mediumZoom from '@fisch0920/medium-zoom'
import { useEffect, useRef } from 'react'
import 'katex/dist/katex.min.css'
import { mapImgUrl } from '@/lib/notion/mapImage'
import { isBrowser, loadExternalResource } from '@/lib/utils'
import { siteConfig } from '@/lib/config'
import { NotionRenderer } from 'react-notion-x'
import BLOG from '@/blog.config'
import getAllPageIds from '@/lib/notion/getAllPageIds'

// Notion渲染
// const NotionRenderer = dynamic(() => import('react-notion-x').then(async (m) => {
//   return m.NotionRenderer
// }), {
//   ssr: false
// })

const Code = dynamic(() =>
  import('react-notion-x/build/third-party/code').then(async (m) => {
    return m.Code
  }), { ssr: false }
)

// 公式
const Equation = dynamic(() =>
  import('@/components/Equation').then(async (m) => {
    // 化学方程式
    await import('@/lib/mhchem')
    return m.Equation
  }), { ssr: false }
)

const Pdf = dynamic(
  () => import('react-notion-x/build/third-party/pdf').then((m) => m.Pdf),
  {
    ssr: false
  }
)

// https://github.com/txs
// import PrismMac from '@/components/PrismMac'
const PrismMac = dynamic(() => import('@/components/PrismMac'), {
  ssr: false
})

/**
 * tweet嵌入
 */
const TweetEmbed = dynamic(() => import('react-tweet-embed'), {
  ssr: false
})

const Collection = dynamic(() =>
  import('react-notion-x/build/third-party/collection').then((m) => m.Collection), { ssr: true }
)

const Modal = dynamic(
  () => import('react-notion-x/build/third-party/modal').then((m) => m.Modal), { ssr: false }
)

const Tweet = ({ id }) => {
  return <TweetEmbed tweetId={id} />
}

const NotionPage = ({ post, className }) => {
  useEffect(() => {
    autoScrollToTarget()
  }, [])

  const zoom = typeof window !== 'undefined' && mediumZoom({
    container: '.notion-viewport',
    background: 'rgba(0, 0, 0, 0.2)',
    margin: getMediumZoomMargin()
  })
  const zoomRef = useRef(zoom ? zoom.clone() : null)

  useEffect(() => {
    // 处理导航页面
    // if (post.category.includes('教程')) {
    // 静态导入导航页面专用样式
    // console.log(post)
    Promise.all([loadExternalResource('/css/navigation.css', 'css')]).then(() => {
      console.log('导航页面专用样式加载完成')
    })
    // 当前页面
    const currentPageId = post.id
    const currentPageContent = post.blockMap.block[currentPageId].value.content
    // 查找当前页面下的表格id
    const tableId = currentPageContent?.find(contentId => {
      return post.blockMap.block[contentId].value.type === 'collection_view'
    })
    if (!tableId) {
      console.warn('[Notion]未找到表格数据', post.blockMap.block[currentPageId], post.blockMap.block[currentPageId].value)
      return null
    }
    // 获取表格数据
    const databaseRecordMap = post.blockMap.block[tableId]
    const rawMetadata = databaseRecordMap.value
    // Check Type Page-Database和Inline-Database
    if (rawMetadata?.type !== 'collection_view_page' && rawMetadata?.type !== 'collection_view') {
      console.error(`pageId "${tableId}" is not a database`)
      return null
    }
    //   console.log('表格', databaseRecordMap, block, rawMetadata)
    // 获取表格的Collection数据
    const collectionId = rawMetadata?.collection_id
    const collection = post.blockMap.collection[collectionId]?.value
    const schema = collection?.schema
    // 获取表格的viewIds数据
    const viewIds = rawMetadata?.view_ids
    // 所有Block/CollectionQuery/allCollectionView
    const allBlock = post.blockMap.block || {}
    const allCollectionQuery = post.blockMap.collection_query
    const allCollectionView = post.blockMap.collection_view
    // 获取所有页面Id
    const pageIds = getAllPageIds(allCollectionQuery, collectionId, allCollectionView, viewIds)
    if (pageIds?.length === 0) {
      console.error('[Notion配置]获取到的数据库列表为空，请检查notion页面', allCollectionQuery, collection, allCollectionView, viewIds, databaseRecordMap)
    }
    // 获取字段所在列
    const galleryProperties = allCollectionView[viewIds[0]]?.value.format.gallery_properties
    const descriptionColumnIndex = getDescriptionColumnIndex(galleryProperties, schema)
    const urlColumnIndex = getUrlColumnIndex(galleryProperties, schema)
    addIcon(allBlock, pageIds, urlColumnIndex)
    setTimeout(() => {
      // 将相册gallery超链接进行修改
      if (isBrowser) {
        const buttonList = document.querySelectorAll('.notion-collection-view-tabs-content-item')
        for (const button of buttonList) {
          button.addEventListener('click', setHrefUrls)
        }
        setHrefUrls(descriptionColumnIndex, urlColumnIndex)
      }
    }, 800)
    // }

    // 将相册gallery下的图片加入放大功能
    if (siteConfig('POST_DISABLE_GALLERY_CLICK')) {
      setTimeout(() => {
        if (isBrowser) {
          const imgList = document?.querySelectorAll('.notion-collection-card-cover img')
          if (imgList && zoomRef.current) {
            for (let i = 0; i < imgList.length; i++) {
              (zoomRef.current).attach(imgList[i])
            }
          }

          const cards = document.getElementsByClassName('notion-collection-card')
          for (const e of cards) {
            e.removeAttribute('href')
          }
        }
      }, 800)
    }
    /**
     * 处理页面内连接跳转
     * 如果链接就是当前网站，则不打开新窗口访问
     */
    if (isBrowser) {
      const currentURL = window.location.origin + window.location.pathname
      const allAnchorTags = document.getElementsByTagName('a') // 或者使用 document.querySelectorAll('a') 获取 NodeList
      for (const anchorTag of allAnchorTags) {
        if (anchorTag?.target === '_blank') {
          const hrefWithoutQueryHash = anchorTag.href.split('?')[0].split('#')[0]
          const hrefWithRelativeHash = currentURL.split('#')[0] + anchorTag.href.split('#')[1]

          if (currentURL === hrefWithoutQueryHash || currentURL === hrefWithRelativeHash) {
            anchorTag.target = '_self'
          }
        }
      }
    }
  }, [])

  if (!post || !post.blockMap) {
    return <>{post?.summary || ''}</>
  }

  return <div id='notion-article' className={`mx-auto overflow-hidden ${className || ''}`}>
    <NotionRenderer
      recordMap={post.blockMap}
      mapPageUrl={mapPageUrl}
      mapImageUrl={mapImgUrl}
      components={{
        Code, Collection, Equation, Modal, Pdf, Tweet
      }} />

    <PrismMac />

  </div>
}

/**
 * 设置点击跳转和样式处理
 */
function setHrefUrls(descriptionColumnIndex, urlColumnIndex) {
  setTimeout(() => {
    const collectionCardBodyList = document.getElementById('notion-article').querySelectorAll('.notion-collection-card-body')
    for (const collectionCardBody of collectionCardBodyList) {
      const children = collectionCardBody.children
      children[descriptionColumnIndex].classList.add('notion-page-description-text')
      // 将描述插入到标题中
      children[0].firstElementChild.firstElementChild.firstElementChild.appendChild(children[descriptionColumnIndex])
      // 将网址设置为跳转链接，并删除原始网址
      const urlText = children[urlColumnIndex].textContent || children[urlColumnIndex]?.firstElementChild?.firstElementChild?.action
      const linkElement = collectionCardBody.parentElement
      linkElement.setAttribute('target', '_blank')
      linkElement.setAttribute('href', urlText)
      children[urlColumnIndex].remove()
    }
  }, 180)
}

/**
 * 根据url参数自动滚动到指定区域
 */
const autoScrollToTarget = () => {
  setTimeout(() => {
    // 跳转到指定标题
    const needToJumpToTitle = window.location.hash
    if (needToJumpToTitle) {
      const tocNode = document.getElementById(window.location.hash.substring(1))
      if (tocNode && tocNode?.className?.indexOf('notion') > -1) {
        tocNode.scrollIntoView({ block: 'start', behavior: 'smooth' })
      }
    }
  }, 180)
}

/**
 * 将id映射成博文内部链接。
 * @param {*} id
 * @returns
 */
const mapPageUrl = id => {
  // return 'https://www.notion.so/' + id.replace(/-/g, '')
  return '/' + BLOG.POST_URL_PREFIX + '/' + id
}

/**
 * 缩放
 * @returns
 */
function getMediumZoomMargin() {
  const width = window.innerWidth

  if (width < 500) {
    return 8
  } else if (width < 800) {
    return 20
  } else if (width < 1280) {
    return 30
  } else if (width < 1600) {
    return 40
  } else if (width < 1920) {
    return 48
  } else {
    return 72
  }
}

/**
 * 根据数据中的url为其添加图标（如果已设置，则不做处理）
 * @param allBlock
 * @param pageIds
 * @param urlColumnIndex
 */
function addIcon(allBlock, pageIds, urlColumnIndex) {
  // 遍历用户的表格
  for (const pageId of pageIds) {
    // 数据库一行的值
    const value = allBlock[pageId]?.value
    if (!value) {
      continue
    }
    const rawProperties = Object.entries(value?.properties || [])
    // eslint-disable-next-line no-unused-vars
    const [key, val] = rawProperties[urlColumnIndex]
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
 * @param galleryProperties
 * @param schema  将属性映射为真实属性值
 */
function getDescriptionColumnIndex(galleryProperties, schema) {
  for (let i = 0; i < galleryProperties.length; i++) {
    const key = galleryProperties[i].property
    if (schema?.[key]?.name === BLOG.NOTION_PROPERTY_NAME.description) {
      return i
    }
  }
}

/**
 * 获取url所在列
 * @param galleryProperties
 * @param schema  将属性映射为真实属性值
 */
function getUrlColumnIndex(galleryProperties, schema) {
  for (let i = 0; i < galleryProperties.length; i++) {
    const key = galleryProperties[i].property
    // 多条件检测是否为网址列
    if (schema?.[key]?.name.toLowerCase().includes(BLOG.NOTION_PROPERTY_NAME.url) || schema?.[key]?.type === 'url') {
      return i
    }
  }
}

export default NotionPage
