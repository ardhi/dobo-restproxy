import factory from './_factory.js'

async function recordUpdate (params = {}) {
  return await factory.call(this, 'update', params)
}

export default recordUpdate
