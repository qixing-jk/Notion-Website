import { isIterable } from '../utils'

/**
 * 获取所有文章的标签
 * @param allPublishedPosts
 * @param sliceCount 默认截取数量为12，若为0则返回全部
 * @param categoryOptions categories的下拉选项
 * @returns {Promise<{}|*[]>}
 */

/**
 * 获取所有文章的分类
 * @param allPublishedPosts
 * @param categoryOptions
 * @param sliceCount
 * @returns {Promise<{}|*[]>}
 */
export function getAllCategories({
  allPublishedPosts,
  categoryOptions,
  sliceCount = 0
}) {
  if (!allPublishedPosts || !categoryOptions) {
    return []
  }
  // 计数
  let categories = allPublishedPosts?.map(p => p.category)
  categories = [...categories.flat()]
  const categoryObj = {}
  categories.forEach(category => {
    if (category in categoryObj) {
      categoryObj[category]++
    } else {
      categoryObj[category] = 1
    }
  })
  const list = []
  if (isIterable(categoryOptions)) {
    for (const c of categoryOptions) {
      const count = categoryObj[c.value]
      if (count) {
        list.push({ id: c.id, name: c.value, color: c.color, count })
      }
    }
  }

  // 按照数量排序
  // list.sort((a, b) => b.count - a.count)
  if (sliceCount && sliceCount > 0) {
    return list.slice(0, sliceCount)
  } else {
    return list
  }
}
