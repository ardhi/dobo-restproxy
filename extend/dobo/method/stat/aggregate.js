import unsupported from '../../generic/unsupported.js'

async function statAggregate ({ schema, filter = {}, options = {} } = {}) {
  const { importModule } = this.app.bajo
  const { getInfo } = this.app.dobo
  const { adapter } = getInfo(schema)
  const { get } = this.app.lib._
  filter.fields = get(options, 'fields')
  filter.group = get(options, 'group')
  filter.aggregate = get(options, 'aggregate')
  const prefix = adapter.provider ? `${adapter.provider}:/extend/doboRestproxy` : 'doboRestproxy:/extend/dobo'
  const mod = await importModule(`${prefix}/lib/${adapter.type}/stat-aggregate.js`)
  if (!mod) return unsupported.call(this)
  return await mod.call(this.app[adapter.ns], { schema, filter, options })
}

export default statAggregate
