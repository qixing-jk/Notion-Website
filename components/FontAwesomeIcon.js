import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'


/**
 * Asynchronously imports and returns a FontAwesome icon based on the specified style and name.
 *
 * @param {string} style - The style prefix for the FontAwesome icon (e.g., 'fas', 'far', 'fab').
 * @param {string} name - The name of the icon in kebab-case (e.g., 'file-word').
 * @returns {Promise<object>} - A promise that resolves to the imported FontAwesome icon.
 * @throws {Error} - Throws an error if the style prefix is invalid.
 */
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

/**
 * A component that renders a FontAwesome icon asynchronously.
 *
 * @param {Object} props - Component props.
 * @param {string} props.icon - The style prefix and name of the icon to render, separated by a space (e.g., 'fas address-card').
 * @returns {JSX.Element} - The rendered FontAwesome icon, or null if the icon could not be loaded.
 */
export const DynamicFontAwesomeIcon = ({ icon }) => {
  const [iconComponent, setIconComponent] = useState(null)

  useEffect(() => {
    getIcon(...icon.split(' ')).then(setIconComponent)
  }, [icon])

  return iconComponent ? <FontAwesomeIcon icon={iconComponent} /> : null
}
