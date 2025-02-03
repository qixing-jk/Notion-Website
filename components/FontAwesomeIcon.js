import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'

const getIcon = async (style, name) => {
  const formattedName = name
    .replace(/-([a-z])/g, (_, char) => char.toUpperCase())
    .replace(/^\w/, c => c.toLowerCase()) // file-word -> fileWord
  const packageMap = {
    fas: '@fortawesome/free-solid-svg-icons',
    far: '@fortawesome/free-regular-svg-icons',
    fab: '@fortawesome/free-brands-svg-icons'
  }

  const packageName = packageMap[style]
  if (!packageName) throw new Error('Invalid style prefix')
  const m = await import(packageName)
  return m[`fa${formattedName}`]
}

export const DynamicIcon = ({ icon }) => {
  const [iconComponent, setIconComponent] = useState(null)

  useEffect(() => {
    getIcon(...icon.split(' ')).then(setIconComponent)
  }, [icon])

  return <FontAwesomeIcon icon={iconComponent} />
}
