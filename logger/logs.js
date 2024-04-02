const fs = require('fs');
const amqp = require('amqplib');
const { db } = require('services/database');

async function start() {
  const connection = await amqp.connect(process.env.MESSAGE_QUEUE);
  const channel = await connection.createChannel();
  await channel.assertQueue('logs', { durable: true });
  await channel.prefetch(1);

  channel.consume('logs', (msg) => {
    const jsonString = '{"info": "' + msg.content.toString() + '"}';
    const jsonLog = JSON.parse(jsonString);

    db.collection('logs').insertOne(jsonLog)
    .then((log) => {
      console.log('Log saved');
      console.log(log);
    })
    .catch(err => {
      console.log('Error saving log');
      console.log(err);
    })
  });
}

start();