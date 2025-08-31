async function factory (pkgName) {
  const me = this

  class DoboRestproxy extends this.app.pluginClass.base {
    static dependencies = ['dobo', 'bajo-extra']
    static alias = 'dbrpx'

    constructor () {
      super(pkgName, me.app)
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

  return DoboRestproxy
}

export default factory
