import { memo, useImperativeHandle } from 'react'
import { Moon, Sun } from './HeroIcons'
import { useTheme } from 'next-themes'

/**
 * 深色模式按钮
 */
const DarkModeButton = props => {
  const { cRef, className } = props
  const { theme, setTheme } = useTheme()
  const isDarkMode = theme === 'dark'

  function handleChangeDarkMode() {
    setTheme(isDarkMode ? 'light' : 'dark')
  }

  /**
   * 对外暴露方法
   */
  useImperativeHandle(cRef, () => {
    return {
      handleChangeDarkMode: handleChangeDarkMode
    }
  })

  return (
    <div
      className={`${className || ''} flex justify-center dark:text-gray-200 text-gray-800`}>
      <div
        onClick={handleChangeDarkMode}
        id='darkModeButton'
        className=' hover:scale-110 cursor-pointer transform duration-200 w-5 h-5'>
        {' '}
        {isDarkMode ? <Sun /> : <Moon />}
      </div>
    </div>
  )
}
export default memo(DarkModeButton)
