import factory from './_factory.js'

async function recordGet (params = {}) {
  return await factory.call(this, 'get', params)
}

export default recordGet
