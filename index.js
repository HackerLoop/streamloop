const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
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

app.get('/camillelv', (req, res) => {
  res.sendFile(__dirname + '/pages/admin.html');
  // dbManager.test();
})

app.get('/admin', (req, res) => {
  res.sendFile(__dirname + '/pages/admin.html');
})

app.get('/overlay/:token/:id', (req, res) => {
  console.log('token:', req.params.token);
  if (!req.params.token || !req.params.id) {
    return res.status(400).send({ message: "token or id missing" });
  }

  res.sendFile(__dirname + `/overlays/${req.params.id}.html`, (err) => {
    //console.log(err);
    if (err) {
      return res.status(400).send({ message: "overlay not found" });
    }
  });
})

app.use(express.static('./overlays'));

var admin = io.of('/admin'),
    client = io.of('');


admin.on('connection', function (socket) {
  socket.on('message', function(m) {
    console.log(m);
  });

  getResources().then((data) => {
    admin.emit('DOSSIER_LIST', data);
  })

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

// OnChannelPoint "Recompense 2"
var parser = controller.getParser('Twitch');
if (parser) {
  var channelPointName = process.env.NODE_ENV !== 'production' ? 'Recompense 1': "Du bouche-à-bouche pour Serge !";

  parser.addTriggerData('OnChannelPoint', [
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

      dbManager.getWidgetData("serge")
        .then(data => {
          data.count++;
          if (data.count > data.max) { return false; };
          var remainder = data.count % data.goal;
          if (data.count > 0 && remainder == 0 && data.count <= data.max) {
            // do something
            // trigger pump
            console.log("trigger Air Pump !", data.duration+"s");
            io.sockets.emit("EVENT_ALERT_SERGE");
            triggerSerge(data.duration);
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

async function getResources() {
  var images, videos;
  images = await cloudinary.api.resources({
    resource_type: 'image',
    type: "upload",
    prefix: "TwitchPhotosDossier/",
    max_results: 500
  }).catch(e => {
    console.log(`Error: ${e.error}`);
    images.resources = [];
  });

  videos = await cloudinary.api.resources({
    resource_type: 'video',
    type: "upload",
    prefix: "TwitchPhotosDossier/",
    max_results: 500
  }).catch(e => {
    console.log(`Error: ${e.error.message}`);
    videos.resources = [];
  });

  var result = [...images.resources, ...videos.resources].sort((a, b) => (a.created_at > b.created_at) ? -1 : 1);

  return result;
}

function revealDossier(data) {
  // getResources().then((data) => {
  //   lol
  // })
  cloudinary.api.resources({
      resource_type: 'image',
      type: 'upload',
      prefix: 'TwitchPhotosDossier/'
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
          // remaining = result.resources;
          // data.revealed = [];
          console.log("no more 'dossier'!");
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
        // cloudinary.api.resources({
        //     resource_type: 'video',
        //     type: 'upload',
        //     prefix: 'TwitchPhotosDossier/'
        //   },
        //   function(error, resultVideos) {
        //     if (error) {
        //       console.log(error);
        //     }
        //     if (resultVideos) {
        //       Array.prototype.push.apply(result.resources, resultVideos.resources);
        //       //result.resources.push();
        //       console.log(result);
        //
        //       var remaining = result.resources.filter(elem => {
        //         return !data.revealed.includes(elem.asset_id);
        //       });
        //       if (remaining.length <= 0) {
        //         // remaining = result.resources;
        //         // data.revealed = [];
        //         console.log("no more 'dossier'!");
        //       }
        //
        //       var item = remaining[Math.floor(Math.random() * remaining.length)];
        //
        //       if (item) {
        //         console.log("item", item);
        //
        //         io.sockets.emit("EVENT_DOSSIER", item);
        //
        //         data.revealed.push(item.asset_id);
        //         dbManager.updateWidgetData(data);
        //       }
        //       else {
        //         console.log("no random item found in remaining dossier !");
        //       }
        //     }
        //   }
        // );

      }
    }
  );

}

const { login } = require("tplink-cloud-api");
const { v4: uuidV4 } = require('uuid');

var tplink;

async function triggerSerge(timer) {
  if (!tplink) {
    console.log("ERROR: tplink is null");
    return false;
  }
  await tplink.getHS100("serge").powerOn();
  await delay(timer*1000);
  await tplink.getHS100("serge").powerOff();
}

async function tpLinkConnect() {
  // log in to cloud, return a connected tplink object
  tplink = await login(
    process.env.TPLINK_USER,
    process.env.TPLINK_PASS,
    process.env.TPLINK_TERM || uuidV4()
  );
  console.log("tpLink "+process.env.TPLINK_USER+" Connected, current auth token is", tplink.getToken());

  // get a list of raw json objects (must be invoked before .get* works)
  const dl = await tplink.getDeviceList();
  console.log("TP Link device list", dl);

  // find a device by alias:
  //myPlug = tplink.getHS100("Serge");
  // or find by deviceId:
  // let myPlug = tplink.getHS100("558185B7EC793602FB8802A0F002BA80CB96F401");
  //console.log("myPlug:", myPlug);

  //let response = await myPlug.powerOn();
  //console.log("response=" + response );

  // let response = await myPlug.toggle();
  // console.log("response=" + response);
  //
  // response = await myPlug.getSysInfo();
  // console.log("relay_state=" + response.relay_state);
  //
  // console.log(await myPlug.getRelayState());
}

tpLinkConnect();

function delay(t, val) {
   return new Promise(function(resolve) {
       setTimeout(function() {
           resolve(val);
       }, t);
   });
}