import path from 'path'
import fs from 'fs'

export function getCwd() {
  // No `process.cwd()` in Cloudflare Worker
  if (typeof process == 'undefined' || !('cwd' in process)) return null
  return process.cwd()
}

export function lookupFile(dir: string, fileNames: string[]): null | string {
  for (const fileName of fileNames) {
    const file = path.join(dir, fileName)
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      return file
    }
  }
  const parentDir = path.dirname(dir)
  if (parentDir !== dir) {
    return lookupFile(parentDir, fileNames)
  }
  return null
}

export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

export function toPosixPath(p: string) {
  return p.split('\\').join('/')
}
