import prepFetch from '../../generic/prep-fetch.js'
import { sanitizeOpts } from './record-find.js'
import path from 'path'

async function statHistogram ({ schema, filter = {}, options = {} } = {}) {
  const { get, isArray } = this.lib._
  const { getInfo } = this.app.dobo
  const { connection } = getInfo(schema)
  const cfg = connection.options ?? {}
  const { url, opts } = await prepFetch.call(this, schema, 'find')
  if (options.count) opts.headers['X-Count'] = true
  if (options.rels) opts.headers['X-Rels'] = options.rels
  opts.params = opts.params ?? {}
  sanitizeOpts.call(this, { filter, cfg, opts })
  opts.params.type = filter.type
  opts.params.group = filter.group
  opts.params.aggregate = filter.aggregate
  opts.params.fields = filter.fields
  if (isArray(opts.params.fields)) opts.params.fields = opts.params.fields.join(',')
  const ext = path.extname(url)
  let resp
  try {
    resp = await this.fetch(url.replace(ext, '') + '/stat/histogram' + ext, opts)
  } catch (err) {
    console.log(err)
  }
  return {
    data: resp[get(cfg, 'responseKey.data')],
    page: resp[get(cfg, 'responseKey.page')],
    limit: resp[get(cfg, 'responseKey.limit')],
    count: resp[get(cfg, 'responseKey.count')],
    pages: resp[get(cfg, 'responseKey.pages')]
  }
}

export default statHistogram
