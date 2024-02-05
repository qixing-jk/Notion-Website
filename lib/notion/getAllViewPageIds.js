/**
 * 根据所有数据库视图获取数据库中的所有页面id
 * @param {{[p: string]: T}} collectionQuery
 * @param {ID|number} collectionId
 * @param {CollectionViewMap} collectionView
 * @param {ID[]} viewIds
 */
export default function getAllViewPageIds(allCollectionQuery, collectionId, allCollectionView, viewIds) {
  if (!allCollectionQuery && !allCollectionView) {
    return []
  }
  let pageIds = []
  const viewsLengthDict = {}
  // 获取数据库所有pageId
  const allCollectionQueryElement = allCollectionQuery[collectionId]
  if (allCollectionQuery && Object.values(allCollectionQuery).length > 0 && allCollectionQueryElement) {
    const pageSet = new Set()
    for (const [index, value] of viewIds.entries()) {
      const viewBlockIds = allCollectionQueryElement[value]?.blockIds || allCollectionQueryElement[value]?.collection_group_results?.blockIds
      viewsLengthDict[index] = viewBlockIds?.length
      viewBlockIds?.forEach(id => pageSet.add(id))
    }
    pageIds = [...pageSet]
    // console.log('PageIds: 从collectionQuery获取', collectionQuery, pageIds.length)
  }
  return [viewsLengthDict, pageIds]
}
