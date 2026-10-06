import { getThemeSwitchMeta } from '@/conf/themeSwitch.manifest'

test('theme controls load with only the deployment theme installed', () => {
  const meta = getThemeSwitchMeta('heo')
  expect(meta.id).toBe('heo')
  expect(meta.settings.length).toBeGreaterThan(0)
})
