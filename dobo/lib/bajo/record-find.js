export function sanitizeOpts ({ filter, cfg, opts }) {
  const { has, isPlainObject } = this.lib._
  const sorts = []
  for (const s in filter.sort ?? {}) {
    sorts.push(`${s}:${filter.sort[s]}`)
  }
  if (sorts.length > 0) opts.params.sort = sorts.join('+')
  delete filter.sort
  for (const k in cfg.qsKey) {
    if (has(filter, k)) {
      const val = isPlainObject(filter[k]) ? JSON.stringify(filter[k]) : filter[k]
      opts.params[cfg.qsKey[k]] = val
    }
  }
}

async function recordFind ({ url, opts, schema, filter, options } = {}) {
  const { getInfo } = this.app.dobo
  const { connection } = getInfo(schema)
  const cfg = connection.options ?? {}
  if (options.count) opts.headers['X-Count'] = true
  if (options.altRels) opts.headers['X-Rels'] = options.altRels.join(',')
  sanitizeOpts.call(this, { filter, cfg, opts })
  return { url, opts }
}

export default recordFind
