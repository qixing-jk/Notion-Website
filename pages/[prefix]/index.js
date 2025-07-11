import BLOG from '@/blog.config'
import useNotification from '@/components/Notification'
import { siteConfig } from '@/lib/config'
import {
  cleanDataBeforeReturn,
  getGlobalData,
  getPost
} from '@/lib/db/getSiteData'
import { useGlobal } from '@/lib/global'
import { getPasswordQuery, sha256Digest } from '@/lib/password'
import { checkSlugHasNoSlash, processPostData } from '@/lib/utils/post'
import { DynamicLayout } from '@/themes/theme'
import { useRouter } from 'next/router'
import { idToUuid } from 'notion-utils'
import { useEffect, useState } from 'react'
import { getRevalidateTime } from '@/lib/utils/revalidate'
import { LayoutSlug } from '@theme-components/LayoutSlug'
import dynamic from 'next/dynamic'
import { getOrSetDataWithCache } from '@/lib/cache/cache_manager'

const OpenWrite = dynamic(() => import('@/components/OpenWrite'))

/**
 * 根据notion的slug访问页面
 * 只解析一级目录例如 /about
 * @param {*} props
 * @returns
 */
const Slug = props => {
  const { post } = props
  const router = useRouter()
  const { locale } = useGlobal()

  // 文章锁🔐
  const [lock, setLock] = useState(post?.password && post?.password !== '')
  const { showNotification, Notification } = useNotification()

  /**
   * 验证文章密码
   * @param {*} passInput
   */
  const validPassword = passInput => {
    if (!post) {
      return false
    }
    const encrypt = sha256Digest(passInput)
    if (passInput && encrypt === post?.password) {
      setLock(false)
      // 输入密码存入localStorage，下次自动提交
      localStorage.setItem(
        'password_' + router.asPath.split(/[?#]/)[0],
        passInput
      )
      showNotification(locale.COMMON.ARTICLE_UNLOCK_TIPS) // 设置解锁成功提示显示
      return true
    }
    return false
  }

  // 文章加载
  useEffect(() => {
    // 文章加密
    if (post?.password && post?.password !== '') {
      setLock(true)
    } else {
      setLock(false)
    }

    // 读取上次记录 自动提交密码
    const passInputs = getPasswordQuery(router.asPath)
    if (passInputs.length > 0) {
      for (const passInput of passInputs) {
        if (validPassword(passInput)) {
          break // 密码验证成功，停止尝试
        }
      }
    }
  }, [post])

  props = { ...props, lock, validPassword }
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  const qrcode = siteConfig('OPEN_WRITE_QRCODE', props.NOTION_CONFIG)
  return (
    <>
      {/* 文章布局 */}
      <DynamicLayout
        theme={theme}
        layoutName='LayoutSlug'
        layout={LayoutSlug}
        {...props}
      />
      {/* 解锁密码提示框 */}
      {post?.password && post?.password !== '' && !lock && <Notification />}
      {/* 导流工具 */}
      {qrcode && <OpenWrite />}
    </>
  )
}

export async function getStaticPaths() {
  if (!BLOG.isProd) {
    return {
      paths: [],
      fallback: true
    }
  }

  const from = 'slug-paths'
  const { allPages } = await getGlobalData({ from })
  const paths = allPages
    ?.filter(row => checkSlugHasNoSlash(row))
    .map(row => ({ params: { prefix: row.slug } }))
  return {
    paths: paths,
    fallback: true
  }
}

export async function getStaticProps({ params: { prefix }, locale }) {
  let fullSlug = prefix
  const from = `slug-props-${fullSlug}`
  let props = await getGlobalData({ from, locale })
  if (siteConfig('PSEUDO_STATIC', false, props.NOTION_CONFIG)) {
    if (!fullSlug.endsWith('.html')) {
      fullSlug += '.html'
    }
  }

  // 在列表内查找文章
  props.post = props?.allPages?.find(p => {
    return (
      p.type.indexOf('Menu') < 0 &&
      (p.slug === prefix || p.id === idToUuid(prefix))
    )
  })

  // 处理非列表内文章的内信息
  if (!props?.post) {
    const pageId = prefix
    if (pageId.length >= 32) {
      props.post = await getPost(pageId)
    }
  }
  if (!props?.post) {
    // 无法获取文章
    return {
      notFound: true
    }
  } else {
    props = await getOrSetDataWithCache(
      `${props.post.id}_${props.post.lastEditedDay}`,
      async (props, from) => {
        await processPostData(props, from)
        cleanDataBeforeReturn(props, from)
        return props
      },
      props,
      from
    )
  }
  return {
    props,
    revalidate: getRevalidateTime(props, 0)
  }
}

export default Slug
