async function driver () {
  const { eachPlugins, readJson } = this.app.bajo
  const { isString } = this.app.lib._
  const type = ['bajo', 'custom']
  const driver = 'restproxy'
  await eachPlugins(async function ({ file }) {
    const { ns } = this
    const cfg = readJson(file)
    if (!cfg.type) return undefined
    if (isString(cfg.type)) cfg.type = [cfg.type]
    cfg.type = cfg.type.map(t => `${t}@${ns}`)
    type.push(...cfg.type)
  }, { glob: 'boot/driver.json', prefix: this.ns })
  return { type, driver }
}

export default driver
