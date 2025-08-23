async function factory (pkgName) {
  const me = this

  return class DoboRestproxy extends this.lib.Plugin {
    constructor () {
      super(pkgName, me.app)
      this.alias = 'dbrpx'
      this.dependencies = ['dobo', 'bajo-extra']
      this.config = {
      }
    }

    fetch = async (url, opts = {}, extra = {}) => {
      const { fetchUrl } = this.app.bajoExtra
      extra.rawResponse = true
      const resp = await fetchUrl(url, opts, extra)
      const result = await resp.json()
      if (!resp.ok) {
        throw this.error(result.message, {
          noTrans: true,
          statusCode: resp.status,
          success: false
        })
      }
      return result
    }
  }
}

export default factory
