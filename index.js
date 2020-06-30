const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const cors = require('cors');

const dbManager = require('./js/dbManager');

const PORT = process.env["PORT"] || 8080;
let ip = require('ip').address();

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/pages/index.html');
  // dbManager.test();
})

app.use(express.static('./overlays'));

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


// Do stuff
require('./js/controller.js');
require('./js/streamElementsAlert/streamElementsAlertHandler');
require('./js/channelPoint/channelPointHandler');

// OnChannelPoint "Recompense 2"
var parserTW = controller.getParser('ChannelPoint');
if (parserTW) {
  parserTW.addTriggerData('OnChannelPoint', [
    "OnChannelPoint",
    "Recompense 2"
  ], controller.triggerCount);
  controller.triggerData[controller.triggerCount] = [
    ["Led", "0"],
    ["delay", "5"],
    ["Led", "1"],
  ];

  controller.triggerCount = controller.triggerCount + 1;
}

// OnSEDonation
var parserSE = controller.getParser('StreamElementsAlert');
if (parserSE) {
  parserSE.addTriggerData('OnSEDonation', [
    "OnSEDonation"
  ], controller.triggerCount);
  controller.triggerData[controller.triggerCount] = [
    ["LOG", "ok"]
  ];

  controller.triggerCount = controller.triggerCount + 1;
}

controller.doneParsing();
setTimeout(function() {
  controller.runInit();
}, 1000);