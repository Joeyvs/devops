const request = require('supertest')
const app = require('../../app')
const { db, client } = require('../../services/database');

describe('Get Users', () => {
  beforeEach(async () => {
    await client.connect()
    await db.collection('users').deleteMany({});
  });

  afterAll(async() => {
    client.close();
  });

  it('should get all users in array', async () => {
    const expected = { 'foo': 'bar' };
    await db.collection('users').insertOne(expected);
    delete expected._id;

    const res = await request(app).get('/users')
    expect(res.statusCode).toEqual(200)
    expect(res.body.length).toEqual(1)
    expect(res.body[0]).toEqual(expect.objectContaining(expected))
  })
})

describe('Post Users', () => {
  beforeEach(async () => {
    await client.connect()
    await db.collection('users').deleteMany({});
  });

  afterAll(async() => {
    client.close();
  });

  it('should return success after posting a new user', async () => {
    const newUser = { 'foo': 'bar' };
    try {
      const count = await db.collection('users').countDocuments()
      const res = await request(app).post('/users').send(newUser)
      const newCount = await db.collection('users').countDocuments()
      expect(newCount).toBe(count + 1)
      expect(res.statusCode).toBe(201)
      expect(res.body).toEqual(expect.objectContaining({ id: expect.any(String) }))
    } catch (err) {
      // write test for failure here
      console.log(`Error ${err}`)
    }
  })

  it('should return error 500 after posting without data', async () => {
      await client.close()  
      const res = await request(app).post('/users')
      expect(res.statusCode).toBe(500)
  })
})