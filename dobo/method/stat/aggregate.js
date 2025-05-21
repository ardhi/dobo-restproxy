import unsupported from '../../generic/unsupported.js'

async function statAggregate ({ schema, filter = {}, options = {} } = {}) {
  const { importModule } = this.app.bajo
  const { getInfo } = this.app.dobo
  const { driver } = getInfo(schema)
  const { get } = this.lib._
  filter.group = get(options, 'req.query.group')
  filter.aggregate = get(options, 'req.query.aggregate')
  const prefix = driver.provider ? `${driver.provider}:/doboRestproxy` : 'doboRestproxy:/dobo'
  const mod = await importModule(`${prefix}/lib/${driver.type}/stat-aggregate.js`)
  if (!mod) return unsupported.call(this)
  return await mod.call(this.app[driver.ns], { schema, filter, options })
}

export default statAggregate
