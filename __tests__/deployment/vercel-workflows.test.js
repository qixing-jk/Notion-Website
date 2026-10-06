/** @jest-environment node */
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import semver from 'semver'

const workflows = ['commit_lighthouse.yml', 'pr-deploy-and-audit.yml'].filter(name => fs.existsSync(path.join(process.cwd(), '.github/workflows', name)))
test.each(workflows)('%s uses a Vercel CLI accepted by the deployment endpoint', name => {
  const workflow = yaml.load(fs.readFileSync(path.join(process.cwd(), '.github/workflows', name), 'utf8'))
  const deploy = Object.values(workflow.jobs).flatMap(job => job.steps).find(step => step.uses?.startsWith('amondnet/vercel-action@'))
  const version = deploy.with['vercel-version']
  expect(semver.valid(version)).not.toBeNull()
  expect(semver.gte(version || '0.0.0', '47.2.2')).toBe(true)
})
