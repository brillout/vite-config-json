export default viteConfigJson
export { viteConfigJson }

import type { Plugin, ResolvedConfig, UserConfig } from 'vite'
import { loadStaticConfig } from './loadStaticConfig'
import { isObject } from './utils'

type JsonProp = { propPath: string; isDefaultValue: (value: unknown) => boolean }
type PluginConfig = { jsonProps: JsonProp[] }

function viteConfigJson(options: {
  jsonProps: JsonProp[]
  projectName: string
  assert: (condition: unknown, debugInfo?: unknown) => asserts condition
  assertUsage: (condition: unknown, msg: string) => asserts condition
  docLink: string
}): Plugin_ {
  return {
    name: `vite-config-json:${options.projectName}`,
    apply: 'build',
    config,
    enforce: 'post',
    configResolved
  } as Plugin

  // Merge multiple `vite-config-json` instances
  function config(config: UserConfig & { viteConfigJson?: PluginConfig }) {
    const viteConfigJson: PluginConfig = config.viteConfigJson ?? { jsonProps: [] }
    viteConfigJson.jsonProps.push(...options.jsonProps)
    return { viteConfigJson }
  }

  // Validate & set config
  function configResolved(config: ResolvedConfig & { viteConfigJson?: PluginConfig }) {
    const { viteConfigJson } = config
    assert(viteConfigJson)
    verifyConfig(config, viteConfigJson.jsonProps)
    setConfig(config, viteConfigJson.jsonProps)
  }

  function setConfig(config: ResolvedConfig, jsonProps: JsonProp[]) {
    const configStatic = loadStaticConfig()
    if (!configStatic) return
    jsonProps.forEach(({ propPath }) => {
      const val = getConfigVal(configStatic, propPath)
      setConfigVal(config, propPath, val)
    })
  }

  function verifyConfig(config: ResolvedConfig, jsonProps: JsonProp[]) {
    jsonProps.forEach(({ propPath, isDefaultValue }) => {
      const configVal = getConfigVal(config, propPath)
      assertUsage(
        isDefaultValue(configVal),
        `The Vite config \`${propPath}\` should be defined in \`vite.config.json\` instead of \`vite.config.js\`. See ${options.docLink} for more information.`
      )
    })
  }

  // Circumvent TS bug
  // https://github.com/microsoft/TypeScript/issues/36931
  function assert(condition: unknown, debugInfo?: unknown): asserts condition {
    options.assert(condition, debugInfo)
  }
  function assertUsage(condition: unknown, msg: string): asserts condition {
    options.assertUsage(condition, msg)
  }
}

function getConfigVal(config: Record<string, unknown>, propPath: string): unknown {
  const [nextProp, ...rest] = propPath.split('.')
  const configVal = config[nextProp]
  if (rest.length === 0) {
    return configVal
  } else {
    if (!isObject(configVal)) {
      return undefined
    } else {
      return getConfigVal(configVal, rest.join('.'))
    }
  }
}
function setConfigVal(config: Record<string, unknown>, propPath: string, val: unknown): void {
  const [nextProp, ...rest] = propPath.split('.')
  if (rest.length === 0) {
    config[nextProp] = val
  } else {
    const configVal = config[nextProp]
    let nested: Record<string, unknown>
    if (isObject(configVal)) {
      nested = configVal
    } else {
      nested = config[nextProp] = {}
    }
    setConfigVal(nested, rest.join('.'), val)
  }
}

// Return type `any` to avoid Plugin type mismatches when there are multiple Vite versions installed
type Plugin_ = any
