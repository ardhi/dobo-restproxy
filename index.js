import restproxyDriverFactory from './extend/dobo/driver/restproxy.js'

/**
 * Plugin factory
 *
 * @param {string} pkgName - NPM package name
 * @returns {class}
 */
async function factory (pkgName) {
  const me = this
  const RestproxyDriver = await restproxyDriverFactory.call(this)

  /**
   * DoboRestproxy class
   *
   * @class
   */
  class DoboRestproxy extends this.app.baseClass.Base {
    constructor () {
      super(pkgName, me.app)
      this.baseClass = { RestproxyDriver }
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
