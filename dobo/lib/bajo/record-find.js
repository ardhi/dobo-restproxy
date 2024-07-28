async function recordFind ({ url, opts, schema, filter, options } = {}) {
  if (options.count) opts.headers['X-Count'] = true
  if (options.rels) opts.headers['X-Rels'] = options.rels
  const sorts = []
  for (const s in filter.sort) {
    sorts.push(`${s}:${filter.sort[s]}`)
  }
  if (sorts.length > 0) opts.params.sort = sorts.join('+')
  delete filter.sort
  return { url, opts }
}

export default recordFind
