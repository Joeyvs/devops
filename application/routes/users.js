const express = require('express')
const router = express.Router()
const amqp = require('amqplib')

const { getUsers, postUser } = require('../services/database')

/* GET users listing. */
router.get('/', async function (req, res) {
  const timeoutMs = 5000; // Set your desired timeout in milliseconds
  let timeoutId;

  const timeoutPromise = new Promise((resolve, reject) => {
    timeoutId = setTimeout(() => {
      clearTimeout(timeoutId);
      reject(new Error('Could not connect to database in time'));
      res.json({ error: 'Could not connect to db' });
    }, timeoutMs);
  });
  const users = await Promise.race([getUsers(), timeoutPromise]);
  clearTimeout(timeoutId); // Clear the timeout if getUsers completes before timeout
  res.json(users);

  await queueLog(`Received a request to get all users`);
})

router.post('/', async function (req, res) {
  if (!req.body.name) {
    res.status(500).json({ error: 'At least a name must be provided' })
    await queueLog(`Failed to create user: At least a name must be provided`);
    return;
  }

  const timeoutMs = 5000; // Set your desired timeout in milliseconds
  let timeoutId;

  const timeoutPromise = new Promise((resolve, reject) => {
    timeoutId = setTimeout(() => {
      clearTimeout(timeoutId);
      reject(new Error('Could not connect to database in time'));
      res.json({ error: 'Could not connect to db' });
    }, timeoutMs);
  });
  const result = await Promise.race([postUser(req.body), timeoutPromise]);
  clearTimeout(timeoutId); // Clear the timeout if getUsers completes before timeout

  if(!result) {
    res.status(500).json({ error: 'Failed to create user' });
    await queueLog(`Failed to create user: Failed to create user`);
    return;
  }

  res.status(201).json({ id: result });
  await queueLog(`User created with ID: ${result} `);
    
})

async function queueLog(log) {
  try {
    const connection = await amqp.connect(process.env.MESSAGE_QUEUE || 'amqp://localhost');
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
