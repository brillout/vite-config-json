import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/index', 'src/loadStaticConfig'],
  rollup: {
    emitCJS: true,
  },
})
