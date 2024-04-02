const fs = require('fs');
const amqp = require('amqplib');

async function start() {
  const connection = await amqp.connect(process.env.MESSAGE_QUEUE);
  const channel = await connection.createChannel();
  await channel.assertQueue('logs', { durable: true });
  await channel.prefetch(1);

  channel.consume('logs', (msg) => {
    fs.appendFile('/logs/logs.txt', msg.content.toString() + '\n', err => channel.ack(msg));
    console.log('Log saved');
  });
}

start();