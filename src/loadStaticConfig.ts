import { getCwd, lookupFile, toPosixPath } from './utils'
import path from 'path'
import fs from 'fs'

export { loadStaticConfig }
export type { ConfigStatic }

type ConfigStatic = { root: string } & Record<string, unknown>

function loadStaticConfig(): null | ConfigStatic {
  const cwd = getCwd()
  if (!cwd) {
    return null
  }
  const filePath = lookupFile(cwd, ['vite.config.json'])
  if (!filePath) {
    const root = findRoot(cwd)
    return { root }
  }

  const jsonConfig: Record<string, unknown> = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

  let root = toPosixPath(path.dirname(filePath))
  if (jsonConfig.root) {
    if (typeof jsonConfig.root !== 'string') {
      throw new Error('vite.config.json#root should be a string')
    }
    if (jsonConfig.root.includes('\\')) {
      throw new Error(`vite.config.json#root is a windows path, but it should be a posix path instead.`)
    }
    root = path.posix.join(root, jsonConfig.root)
  }

  return { ...jsonConfig, root }
}

function findRoot(cwd: string): string {
  const configFile = lookupFile(cwd, [
    'vite.config.js',
    'vite.config.cjs',
    'vite.config.mjs',
    'vite.config.ts',
    'package.json'
  ])
  if (!configFile) throw new Error(`The current directoy ${cwd} seems to be outside of a Vite app.`)
  const root = toPosixPath(path.dirname(configFile))
  return root
}
