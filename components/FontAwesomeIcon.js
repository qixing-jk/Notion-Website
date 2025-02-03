import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'

const getIcon = async (style, name) => {
  const formattedName = name
    .replace(/-([a-z])/g, (_, char) => char.toUpperCase())
    .replace(/^\w/, c => c.toLowerCase()) // file-word -> fileWord

  let iconModule
  switch (style) {
    case 'fas':
    case 'fa-solid':
      iconModule = await import('@fortawesome/free-solid-svg-icons')
      break
    case 'far':
    case 'fa-regular':
      iconModule = await import('@fortawesome/free-regular-svg-icons')
      break
    case 'fab':
    case 'fa-brands':
      iconModule = await import('@fortawesome/free-brands-svg-icons')
      break
    default:
      throw new Error('Invalid style prefix')
  }

  return iconModule[formattedName]
}

export const DynamicFontAwesomeIcon = ({ icon }) => {
  const [iconComponent, setIconComponent] = useState(null)

  useEffect(() => {
    getIcon(...icon.split(' ')).then(setIconComponent)
  }, [icon])

  return iconComponent ? <FontAwesomeIcon icon={iconComponent} /> : null
}
