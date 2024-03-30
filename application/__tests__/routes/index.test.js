const request = require('supertest')
const app = require('../../app')

describe('Get Index', () => {
  it('should return status code 200', async () => {
    const res = await request(app).get('/')
    expect(res.statusCode).toEqual(200)
  })
})