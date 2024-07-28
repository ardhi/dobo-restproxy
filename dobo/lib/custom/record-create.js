import factory from './_factory.js'

async function recordCreate (params = {}) {
  return await factory.call(this, 'create', params)
}

export default recordCreate
