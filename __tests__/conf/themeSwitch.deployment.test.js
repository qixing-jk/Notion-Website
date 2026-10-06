import { getThemeSwitchMeta } from '@/conf/themeSwitch.manifest'

test('theme controls load with only the deployment theme installed', () => {
  const meta = getThemeSwitchMeta('starter')
  expect(meta.id).toBe('starter')
  expect(meta.settings.length).toBeGreaterThan(0)
})
