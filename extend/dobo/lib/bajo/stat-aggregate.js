import prepFetch from '../../generic/prep-fetch.js'
import { sanitizeOpts } from './record-find.js'
import path from 'path'

async function statAggregate ({ schema, filter = {}, options = {} } = {}) {
  const { get, isArray } = this.lib._
  const { getInfo } = this.app.dobo
  const { connection } = getInfo(schema)
  const cfg = connection.options ?? {}
  const { url, opts } = await prepFetch.call(this, schema, 'find')
  if (options.count) opts.headers['X-Count'] = true
  opts.params = opts.params ?? {}
  sanitizeOpts.call(this, { filter, cfg, opts })
  opts.params.group = filter.group
  opts.params.aggregate = filter.aggregate
  opts.params.fields = filter.fields
  if (isArray(opts.params.fields)) opts.params.fields = opts.params.fields.join(',')
  const ext = path.extname(url)
  const resp = await this.fetch(url.replace(ext, '') + '/stat/aggregate' + ext, opts)
  return {
    data: resp[get(cfg, 'responseKey.data')],
    page: resp[get(cfg, 'responseKey.page')],
    limit: resp[get(cfg, 'responseKey.limit')],
    count: resp[get(cfg, 'responseKey.count')],
    pages: resp[get(cfg, 'responseKey.pages')]
  }
}

export default statAggregate
