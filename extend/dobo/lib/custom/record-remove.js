import factory from './_factory.js'

async function recordRemove (params = {}) {
  return await factory.call(this, 'remove', params)
}

export default recordRemove
