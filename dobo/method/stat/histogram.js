import unsupported from '../../generic/unsupported.js'

async function statHistogram ({ schema, filter = {}, options = {} } = {}) {
  const { importModule } = this.app.bajo
  const { getInfo } = this.app.dobo
  const { driver } = getInfo(schema)
  const { get } = this.lib._
  filter.fields = get(options, 'fields')
  filter.type = get(options, 'type')
  filter.group = get(options, 'group')
  filter.aggregate = get(options, 'aggregate')
  const prefix = driver.provider ? `${driver.provider}:/doboRestproxy` : 'doboRestproxy:/dobo'
  const mod = await importModule(`${prefix}/lib/${driver.type}/stat-histogram.js`)
  if (!mod) return unsupported.call(this)
  return await mod.call(this.app[driver.ns], { schema, filter, options })
}

export default statHistogram
