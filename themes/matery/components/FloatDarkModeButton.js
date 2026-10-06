import CONFIG from '../config'
import { siteConfig } from '@/lib/config'
import { useTheme } from 'next-themes'

export default function FloatDarkModeButton() {
  const { resolvedTheme, setTheme } = useTheme()

  if (!siteConfig('WIDGET_DARK_MODE', null, CONFIG)) {
    return <></>
  }

  const isDarkMode = resolvedTheme === 'dark'

  function handleChangeDarkMode() {
    setTheme(isDarkMode ? 'light' : 'dark')
  }

  return (
    <div
      className='flex justify-center items-center text-center select-none'
      onClick={handleChangeDarkMode}>
      <i
        id='darkModeButton'
        className={`${isDarkMode ? 'fa-sun' : 'fa-moon'} fas transform hover:scale-105 duration-200 text-white bg-indigo-700 w-10 h-10 rounded-full dark:bg-black cursor-pointer flex justify-center items-center`}
      />
    </div>
  )
}
