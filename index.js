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
require('./js/chat/chatHandler');

// OnChannelPoint "Recompense 2"
var parser = controller.getParser('ChannelPoint');
if (parser) {
  parser.addTriggerData('OnChannelPoint', [
    "OnChannelPoint",
    "Du bouche-à-bouche pour Serge !"
  ], controller.triggerCount);
  controller.triggerData[controller.triggerCount] = [
    ["FUNCTION", (msg) => {
      console.log("Du bouche-à-bouche pour Serge !", msg.data);
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

// cloudinary.config({
//   cloud_name: "dcr72h6g0",
//   api_key: "378243186252451",
//   api_secret: "vCuEp73WpSC_ydasMRYhFKcp_pw"
// });

function revealDossier(data) {
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

const TPLINK_USER = process.env.TPLINK_USER || "jorand.lepape@gmail.com";
const TPLINK_PASS = process.env.TPLINK_PASS || "just4now";
const TPLINK_TERM = process.env.TPLINK_TERM || "ce84004a-c4e6-4fb1-8760-a1fe2145af95";

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
  tplink = await login(TPLINK_USER, TPLINK_PASS, TPLINK_TERM);
  console.log("tpLink Connected, current auth token is", tplink.getToken());

  // get a list of raw json objects (must be invoked before .get* works)
  const dl = await tplink.getDeviceList();
  console.log(dl);

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