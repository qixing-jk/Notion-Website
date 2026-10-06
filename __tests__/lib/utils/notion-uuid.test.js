/** @jest-environment node */
import { execFileSync } from 'node:child_process'

test('the installed Notion utilities keep the fork null-safe UUID patch', () => {
  const result = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import { uuidToId } from 'notion-utils';
    console.log(JSON.stringify([
      uuidToId(undefined), uuidToId(null),
      uuidToId('11111111-1111-4111-8111-111111111111')
    ]));
  `
    ],
    { cwd: process.cwd(), encoding: 'utf8' }
  )
  expect(JSON.parse(result)).toEqual([
    '',
    '',
    '11111111111141118111111111111111'
  ])
})
