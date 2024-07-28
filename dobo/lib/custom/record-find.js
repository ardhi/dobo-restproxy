import factory from './_factory.js'

async function recordFind (params = {}) {
  return await factory.call(this, 'find', params)
}

export default recordFind
