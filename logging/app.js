var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const amqp = require('amqplib');
const { db } = require('./services/database');

async function start() {
  const connection = await amqp.connect(process.env.MESSAGE_QUEUE);
  const channel = await connection.createChannel();
  await channel.assertQueue('logs', { durable: true });
  await channel.prefetch(1);

  channel.consume('logs', (msg) => {
    logMsg(msg.content.toString());
  });
}

function logMsg(msg) {
  const jsonString = '{"info": "' + msg + '"}';
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
}

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

if (process.env.NODE_ENV !== 'test') {
    start();
}

module.exports = app;
