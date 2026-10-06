import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GlobalContextProvider, useGlobal } from '@/lib/global'

jest.mock('@/blog.config', () => ({
  APPEARANCE: 'light',
  LANG: 'en',
  THEME: 'heo'
}))
jest.mock('@clerk/nextjs', () => ({ useUser: jest.fn() }))
jest.mock('@/themes/theme', () => ({
  THEMES: ['heo'],
  getThemeConfig: async () => ({}),
  initDarkMode: jest.fn(),
  saveDarkModeToLocalStorage: jest.fn()
}))
jest.mock('@/lib/utils/lang', () => ({
  generateLocaleDict: () => ({}),
  initLocale: jest.fn(),
  redirectUserLang: jest.fn()
}))
jest.mock('next-themes', () => {
  const React = require('react')
  return {
    useTheme: () => {
      const [resolvedTheme, setTheme] = React.useState('dark')
      return { resolvedTheme, setTheme }
    }
  }
})

function ModeControl() {
  const { isDarkMode, toggleDarkMode } = useGlobal()
  return (
    <button onClick={toggleDarkMode}>{isDarkMode ? 'Dark' : 'Light'}</button>
  )
}

test('global controls use the saved next-themes mode and can switch it', async () => {
  const user = userEvent.setup()
  render(
    <GlobalContextProvider>
      <ModeControl />
    </GlobalContextProvider>
  )
  await user.click(await screen.findByRole('button', { name: 'Dark' }))
  expect(screen.getByRole('button', { name: 'Light' })).toBeVisible()
})
