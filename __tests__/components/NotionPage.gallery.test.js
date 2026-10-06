import { render, waitFor } from '@testing-library/react'
import NotionPage from '@/components/NotionPage'
import { GalleryBeautification } from '@/lib/GalleryBeautification'

jest.mock('@/lib/config', () => ({
  siteConfig: key => key === 'GALLERY_BEAUTIFICATION'
}))
jest.mock('@/lib/db/notion/mapImage', () => ({
  compressImage: value => value,
  mapImgUrl: value => value
}))
jest.mock('@/lib/utils', () => ({
  isBrowser: true,
  loadExternalResource: jest.fn(async () => {})
}))
jest.mock('@/lib/GalleryBeautification', () => ({
  GalleryBeautification: jest.fn()
}))
jest.mock('@/components/NotionEmbed', () => ({
  __esModule: true,
  default: () => null
}))
jest.mock('@/components/NotionLink', () => ({
  __esModule: true,
  default: () => null
}))
jest.mock('@/components/OriginalityProof', () => ({
  __esModule: true,
  default: () => null
}))
jest.mock('@fisch0920/medium-zoom', () => ({
  __esModule: true,
  default: jest.fn()
}))
jest.mock('react-notion-x', () => ({ NotionRenderer: () => null }))

test('keeps custom gallery beautification for posts containing collections', async () => {
  const post = {
    id: 'post',
    blockMap: { block: {}, collection: { gallery: { value: {} } } }
  }
  render(<NotionPage post={post} />)
  await waitFor(() => expect(GalleryBeautification).toHaveBeenCalledWith(post))
})
