const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const cors = require('cors');

const dbManager = require('./dbManager');

const PORT = process.env["PORT"] || 8080;
let ip = require('ip').address();

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
  dbManager.test();
})

app.use(express.static('./public'));

io.on('connection', (socket) => {
  console.log('a user connected');

  //dbManager.init(io);

  socket.on('error', function(error) {
    console.log('error', error);
  });

  socket.on('disconnect', (error) => {
    console.log('user disconnected', error);
  });
});

var server = http.listen(PORT, () => {
  console.log(`App running on port ${PORT}!`);
  console.log(`listening to server on: http://${ip}:${PORT}`);
});

