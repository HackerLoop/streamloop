const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
  pingInterval: 25000,
  pingTimeout: 60000,
});
const bodyParser = require('body-parser');
const cors = require('cors');

const dbManager = require('./js/dbManager');

console.log("NODE_ENV", process.env.NODE_ENV);

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const PORT = process.env["PORT"] || 8080;
let ip = require('ip').address();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/pages/index.html');
  // dbManager.test();
})

app.get(`/${process.env.TWITCH_USER}`, checkToken, (req, res) => {
  res.sendFile(__dirname + '/pages/admin.html');
  // dbManager.test();
})

app.get('/admin', checkToken, (req, res) => {
  res.sendFile(__dirname + '/pages/admin.html');
})

app.get(`/overlay/${process.env.TWITCH_USER}/:id`, checkToken, (req, res) => {
  //console.log('token:', req.params.token);
  if (!req.params.id) {
    return res.status(400).send({ message: "token or id missing" });
  }

  res.sendFile(__dirname + `/overlays/${req.params.id}.html`, (err) => {
    //console.log(err);
    if (err) {
      return res.status(400).send({ message: "overlay not found" });
    }
  });
})

app.use('/assets', express.static('./overlays/assets'));

function checkToken(req, res, next) {
  if (req.query.secret == process.env.APP_SECRET_TOKEN) {
    return next();
  }
  res.status(401);
  res.send({ message: 'Invalid request!'});
}


var admin = io.of('/admin'),
    client = io.of('');

admin.on('connection', function (socket) {
  socket.on('message', function(m) {
    console.log(m);
  });


  socket.on('TEST_DOSSIER', function(type) {
    testDossier(type);
  });

  //admin.emit('message1', 'Message1: admin to admin');
  //client.emit('message1', 'Message1: admin to client');
});

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

  socket.on('TEST_SERGE', (data) => {
    triggerSerge(data);
  });

  socket.on('RELOAD_OVERLAYS', () => {
    console.log('Reload all Overlays !');
    io.sockets.emit("RELOAD_OVERLAY");
  });
});

var server = http.listen(PORT, () => {
  console.log(`App running on port ${PORT}!`);
  console.log(`listening to server on: http://${ip}:${PORT}`);
});


// Do stuff
require('./js/controller.js');
require('./js/streamElementsAlert/streamElementsAlertHandler');
require('./js/twitch/twitchHandler');
require('./js/chat/chatHandler');

var parserTwitch = controller.getParser('Twitch');
var parserSE = controller.getParser('StreamElementsAlert');


if (parserTwitch) {
  // OnChannelPoint
  var channelPointName = process.env.NODE_ENV !== 'production' ? 'Recompense 1': "streamBoss";

  parserTwitch.addTriggerData('OnChannelPoint', [
    "OnChannelPoint",
    channelPointName
  ], controller.triggerCount);
  controller.triggerData[controller.triggerCount] = [
    ["FUNCTION", (msg) => {
      console.dir(msg.data, { depth: null });

      var newEvent = {
        listener: 'OnChannelPoint',
        event: msg.data
      }
      dbManager.addEvent(newEvent);

      // dbManager.getWidgetData("serge")
      //   .then(data => {
      //     data.count++;
      //     if (data.count > data.max) { return false; };
      //     var remainder = data.count % data.goal;
      //     if (data.count > 0 && remainder == 0 && data.count <= data.max) {
      //       // do something
      //       // trigger pump
      //       console.log("trigger Air Pump !", data.duration+"s");
      //       io.sockets.emit("EVENT_ALERT_SERGE");
      //       triggerSerge(data.duration);
      //     }
      //     dbManager.updateWidgetData(data);
      //   });
    }]
  ];

  controller.triggerCount = controller.triggerCount + 1;
}

if (parserSE) {
  // OnSEDonation
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

      // dbManager.getViewer()
      //   .then(data => {
      //     console.log(data);
      //     console.log(data.count, msg.amount);
      //     data.count = data.count + msg.amount;
      //     if (data.count >= data.goal) {
      //       data.count = data.count - data.goal;
      //
      //       console.log("Reveal Image Dossier !");
      //       revealDossier(data);
      //     }
      //     dbManager.updateWidgetData(data);
      //   });

      // dbManager.getWidgetData("leaderboard")
      //   .then(data => {
      //     console.log(data);
      //     console.log(data.count, msg.amount);
      //     data.count = data.count + msg.amount;
      //     if (data.count >= data.goal) {
      //       data.count = data.count - data.goal;
      //
      //       console.log("Reveal Image Dossier !");
      //       revealDossier(data);
      //     }
      //     dbManager.updateWidgetData(data);
      //   });
    }]
  ];
  controller.triggerCount = controller.triggerCount + 1;

  // Bits
  parserSE.addTriggerData('OnSETwitchBits', [
    "OnSETwitchBits"
  ], controller.triggerCount);
  controller.triggerData[controller.triggerCount] = [
    ["FUNCTION", (msg) => {
      console.log(msg);
      var newEvent = {
        listener: 'OnSETwitchBits',
        event: msg
      }
      dbManager.addEvent(newEvent);

      // do something
    }]
  ];
  controller.triggerCount = controller.triggerCount + 1;

  // Sub
  parserSE.addTriggerData('OnSETwitchSub', [
    "OnSETwitchSub"
  ], controller.triggerCount);
  controller.triggerData[controller.triggerCount] = [
    ["FUNCTION", (msg) => {
      console.log(msg);
      var newEvent = {
        listener: 'OnSETwitchSub',
        event: msg
      }
      dbManager.addEvent(newEvent);

      // do something
    }]
  ];
  controller.triggerCount = controller.triggerCount + 1;
}

controller.doneParsing();
controller.runInit();

function delay(t, val) {
   return new Promise(function(resolve) {
       setTimeout(function() {
           resolve(val);
       }, t);
   });
}