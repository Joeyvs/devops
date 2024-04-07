const express = require('express')
const router = express.Router()
const amqp = require('amqplib')

const { db } = require('../services/database')

/* GET users listing. */
router.get('/', async function (req, res) {
  if(db) { 
    const users = await db.collection('users').find().toArray()
    res.json(users)
  } else {
    res.json({ msg: 'No database connection'})
  }

  await queueLog(`Received a request to get all users`);
})

router.post('/', async function (req, res) {
  if (!req.body.name) {
    res.status(500).json({ error: 'At least a name must be provided' })
    queueLog(`Failed to create user: At least a name must be provided`);
    return;
  }

  db.collection('users').insertOne(req.body)
    .then(async (user) => {
      res.status(201).json({ id: user.insertedId });
      await queueLog(`User created with ID: ${user.insertedId} `);
    })
    .catch(async (err) => {
      res.status(500).json(err)
      await queueLog(`Failed to create user: ${err}`);
    })
    
})

async function queueLog(log) {
  try {
    const connection = await amqp.connect(process.env.MESSAGE_QUEUE || 'amqp://localhost');
    console.log(connection);
    if(!connection) {
      return;
    }
    console.log('Connected to message queue');

    const channel = await connection.createChannel();
    if(!channel) {
      return;
    }

    await channel.assertQueue('logs', { durable: true });
    channel.sendToQueue('logs', Buffer.from(log));

    await channel.close();
  }
  catch(err) { /* empty */ }	
  
}

module.exports = router
