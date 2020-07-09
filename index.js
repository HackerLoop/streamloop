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
  // console.log(socket.handshake.query.user);

  dbManager.init(io);

  socket.on('message', function(msg) {
    console.log('message', msg);
  });

  socket.on('UPDATE_WIDGET', function(obj) {
    dbManager.updateWidgetData(obj);
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

      dbManager.getWidgetData("serge")
        .then(data => {
          data.count++;
          if (data.count > data.max) { return false; };
          if (data.count-data.offset >= data.goal && data.count <= data.max) {
            data.offset = data.count;
            // do something
            // trigger pump
            console.log("trigger Air Pump !", data.duration+"s");
            io.sockets.emit("EVENT_ALERT_SERGE");
          }
          dbManager.updateWidgetData(data);
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

      dbManager.getWidgetData("dossier")
        .then(data => {
          console.log(data);
          console.log(data.count, msg.amount);
          data.count = data.count + msg.amount;
          if (data.count >= data.goal) {
            data.count = data.count - data.goal;

            console.log("Reveal Image Dossier !");
            revealDossier(data);
          }
          dbManager.updateWidgetData(data);
        });
    }]
  ];

  controller.triggerCount = controller.triggerCount + 1;
}

controller.doneParsing();
controller.runInit();

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: "dcr72h6g0",
  api_key: "378243186252451",
  api_secret: "vCuEp73WpSC_ydasMRYhFKcp_pw"
});

function revealDossier(data) {
  cloudinary.api.resources({
      type: 'upload',
      prefix: 'test/'
    },
    function(error, result) {
      if (error) {
        console.log(error);
      }
      if (result) {
        console.log(result);
        var remaining = result.resources.filter(elem => {
          return !data.revealed.includes(elem.asset_id);
        });
        if (remaining.length <= 0) {
          remaining = result.resources;
          data.revealed = [];
          console.log("no more 'dossier'! restart");
        }

        var item = remaining[Math.floor(Math.random() * remaining.length)];

        if (item) {
          console.log("item", item);

          io.sockets.emit("EVENT_DOSSIER", item);

          data.revealed.push(item.asset_id);
          dbManager.updateWidgetData(data);
        }
        else {
          console.log("no random item found in remaining dossier !");
        }
      }
    }
  );

}