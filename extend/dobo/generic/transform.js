function mapFields (data, conn, reverse) {
  const { get, invert } = this.app.lib._
  const fm = invert(conn.fieldsMap)
  const newData = {}
  for (const key in data) {
    const nkey = get(reverse ? fm.fieldsMap : conn.fieldsMap, key, key)
    newData[nkey] = data[key]
  }
  return newData
}

async function transform (data, schema, reverse) {
  const { callHandler } = this.app.bajo
  const { getInfo } = this.app.dobo
  const { isString } = this.app.lib._
  const { connection } = getInfo(schema)
  const arr = Array.isArray(data)
  if (!arr) data = [data]
  for (const i in data) {
    let d = data[i]
    if (isString(connection.transformer)) d = await callHandler(this, connection.transformer, d, schema)
    data[i] = mapFields.call(this, d, connection, reverse)
  }
  return arr ? data : data[0]
}

export default transform
