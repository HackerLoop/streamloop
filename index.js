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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/pages/index.html');
  // dbManager.test();
})

app.get('/admin', (req, res) => {
  res.sendFile(__dirname + '/pages/admin.html');
  // dbManager.test();
})

app.use(express.static('./overlays'));

io.on('connection', (socket) => {
  console.log('a user connected');
  console.log(socket.handshake.query.user);

  dbManager.init(io);

  socket.on('message', function(msg) {
    console.log('message', msg);
  });

  socket.on('getUsers', function() {
    dbManager.getUsers()
      .then(result => {
        console.log(result);
        socket.emit('users', result);
      })
      .catch(err => {
        console.log(err);
      });
  });

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
var parser = controller.getParser('ChannelPoint');
if (parser) {
  parser.addTriggerData('OnChannelPoint', [
    "OnChannelPoint",
    "Recompense 2"
  ], controller.triggerCount);
  controller.triggerData[controller.triggerCount] = [
    ["FUNCTION", (msg) => {
      console.log("Recompense 2", msg.data);
      var newEvent = {
        listener: 'OnChannelPoint',
        event: msg.data
      }
      dbManager.addEvent(newEvent);

      dbManager.getWidgetData("michel")
        .then(data => {
          data.count++;
          if (data.count-data.offset >= data.goal && data.count <= data.max) {
            data.offset = data.count;
            // do something
            // trigger pump
          }
          dbManager.updateWidgetData("michel", data);
        });
    }]
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
    ["FUNCTION", (msg) => {
      console.log(msg);
      var newEvent = {
        listener: 'OnSEDonation',
        event: msg
      }
      dbManager.addEvent(newEvent);
    }]
  ];

  controller.triggerCount = controller.triggerCount + 1;
}

controller.doneParsing();
controller.runInit();