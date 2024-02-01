/**
 * 根据所有数据库视图获取数据库中的所有页面id
 * @param {{[p: string]: T}} collectionQuery
 * @param {ID|number} collectionId
 * @param {CollectionViewMap} collectionView
 * @param {ID[]} viewIds
 */
export default function getAllViewPageIds(collectionQuery, collectionId, collectionView, viewIds) {
  if (!collectionQuery && !collectionView) {
    return []
  }
  let pageIds = []
  // 获取数据库所有pageId
  if (collectionQuery && Object.values(collectionQuery).length > 0 && collectionQuery[collectionId]) {
    const pageSet = new Set()
    Object.values(collectionQuery[collectionId]).forEach(view => {
      view?.blockIds?.forEach(id => pageSet.add(id)) // group视图
      view?.collection_group_results?.blockIds?.forEach(id => pageSet.add(id)) // table视图
    })
    pageIds = [...pageSet]
    // console.log('PageIds: 从collectionQuery获取', collectionQuery, pageIds.length)
  }
  return pageIds
}
