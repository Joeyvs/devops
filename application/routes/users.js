const express = require('express')
const router = express.Router()
const amqp = require('amqplib')

const { db } = require('../services/database')

/* GET users listing. */
router.get('/', async function (req, res) {
  const users = await db.collection('users').find().toArray()
  res.json(users)

  const connection = await amqp.connect(process.env.MESSAGE_QUEUE)
  const channel = await connection.createChannel();
  await channel.assertQueue('logs', { durable: true });

  channel.sendToQueue('logs', Buffer.from(`Received a request to get all users`))
})

router.post('/', async function (req, res) {
  const connection = await amqp.connect(process.env.MESSAGE_QUEUE)
  const channel = await connection.createChannel();
  await channel.assertQueue('logs', { durable: true });

  db.collection('users').insertOne(req.body)
    .then((user) => {
      res.status(201).json({ id: user.insertedId })
      channel.sendToQueue('logs', Buffer.from(`User created with ID: ${user.insertedId} `))
    })
    .catch(err => {
      res.status(500).json(err)
      channel.sendToQueue('logs', Buffer.from(`Failed to create user: ${err}`))
    })
    
})

module.exports = router
