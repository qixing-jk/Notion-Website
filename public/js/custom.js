function processSpoiler() {
  const articleElement = document.querySelector(
    '#article-wrapper #notion-article'
  )
  if (articleElement) {
    setTimeout(() => {
      processTextNodes(articleElement, 'spoiler-text')
      observer.disconnect()
    }, 3000)
  }
}

function processTextNodes(root, className) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null)
  while (walker.nextNode()) {
    const node = walker.currentNode
    const wholeText = node.textContent // 获取文本内容

    const fragments = []
    let lastIndex = 0
    let match
    const regex = /\[sp](.*?)\[\/sp]/g
    while ((match = regex.exec(wholeText)) !== null) {
      console.log('符合要求的文字' + wholeText)
      // 添加前面未匹配的部分
      if (match.index > lastIndex) {
        fragments.push(
          document.createTextNode(wholeText.slice(lastIndex, match.index))
        )
      }

      // 创建 span 包裹的内容
      const span = document.createElement('span')
      span.textContent = match[1] // 提取匹配的内容
      if (className) {
        span.className = className
      }
      fragments.push(span)
      // 设置lastIndex
      lastIndex = regex.lastIndex
    }
    if (fragments.length) {
      // 添加剩余未匹配的部分
      if (lastIndex < wholeText.length) {
        fragments.push(document.createTextNode(wholeText.slice(lastIndex)))
      }

      // 替换原节点
      fragments.forEach(fragment => {
        console.log(node.parentNode.appendChild(fragment))
      })
      node.remove()
    }
  }
}

const observer = new MutationObserver(() => {
  processSpoiler()
})

observer.observe(document.body, { childList: true, subtree: true })
