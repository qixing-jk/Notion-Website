import Image from 'next/image'
import TagItem from './TagItem'
import { siteConfig } from '@/lib/config'
import NotionIcon from '@/components/NotionIcon'
import { sha256Digest } from '@/lib/password'

export const ArticleInfo = props => {
  const { post } = props

  const emailHash = sha256Digest(siteConfig('CONTACT_EMAIL', '#'))

  return (
    <section className='flex-wrap flex mt-2 text-gray--600 dark:text-gray-400 font-light leading-8'>
      <div>
        <h1 className='font-bold text-3xl text-black dark:text-white'>
          {siteConfig('POST_TITLE_ICON') && (
            <NotionIcon icon={post?.pageIcon} />
          )}
          {post?.title}
        </h1>

        {post?.type !== 'Page' && (
          <>
            <nav className='flex mt-7 items-start text-gray-500 dark:text-gray-400'>
              <div className='flex mb-4'>
                <a href={siteConfig('CONTACT_GITHUB', '#')} className='flex'>
                  <Image
                    alt={siteConfig('AUTHOR')}
                    width={24}
                    height={24}
                    src={`https://gravatar.com/avatar/${emailHash}`}
                    className='rounded-full'
                  />
                  <p className='ml-2 md:block'>{siteConfig('AUTHOR')}</p>
                </a>
                <span className='block'>&nbsp;/&nbsp;</span>
              </div>
              <div className='mr-2 mb-4 md:ml-0'>{post?.publishDay}</div>
              {post?.tags && (
                <div className='flex flex-nowrap max-w-full overflow-x-auto article-tags'>
                  {post?.tags.map(tag => (
                    <TagItem key={tag} tag={tag} />
                  ))}
                </div>
              )}
              <span className='hidden busuanzi_container_page_pv mr-2'>
                <i className='mr-1 fas fa-eye' />
                &nbsp;
                <span className='mr-2 busuanzi_value_page_pv' />
              </span>
            </nav>
          </>
        )}
      </div>
    </section>
  )
}
