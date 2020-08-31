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

/* API */
app.get(`/api/mrpierrecroce/score`, (req, res) => {
  dbManager.getWidgetData("crossket")
    .then(data => {
      res.send(''+data.currentSuccess);
    });
})

app.get(`/api/mrpierrecroce/king`, (req, res) => {
  dbManager.getWidgetData("streamboss")
    .then(data => {
      res.send(''+data.boss.user);
    });
})

app.post('/api/mrpierrecroce/dunk', checkToken, (req, res) => {
  console.log(req.body);
  newDunk(req.body.success, req.body.fail);
  res.send('ok');
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

  // socket.on('TEST_DOSSIER', function(type) {
  //   testDossier(type);
  // });

  socket.on('RESET_STREAMBOSS', function(obj) {
    dbManager.resetSessionLeaderboard(obj);
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
// require('./js/streamElementsAlert/streamElementsAlertHandler');
require('./js/streamlabs/streamlabsHandler');
require('./js/twitch/twitchHandler');
// require('./js/chat/chatHandler');

var parserTwitch = controller.getParser('Twitch');
// var parserSE = controller.getParser('StreamElementsAlert');
var parserStreamlabs = controller.getParser('Streamlabs');

if (parserStreamlabs) {
  // OnSLDonationNoSync
  parserStreamlabs.addTriggerData('OnSLDonationNoSync', [
    "OnSLDonationNoSync"
  ], controller.triggerCount);
  controller.triggerData[controller.triggerCount] = [
    ["FUNCTION", (msg) => {
      console.log("OnSLDonationNoSync");
      console.log(msg);
      if (msg.user == process.env.TWITCH_USER && !msg.data.isTest) {
        return false;
      }
      var test = msg.data.isTest;

      if (!test) {
        var newEvent = {
          listener: 'OnSLDonationNoSync',
          event: msg
        }
        dbManager.addEvent(newEvent);
      }

      dbManager.getWidgetData("streamboss")
        .then(data => {
          var points = msg.amount * data.donationPoint;
          if (!test) {
            addViewerPoints(points, msg, data);
          }
          else {
            sendTestViewerEvent(points, msg, data);
          }
        });
    }]
  ];
  controller.triggerCount = controller.triggerCount + 1;

  // OnSLTwitchBitsNoSync
  parserStreamlabs.addTriggerData('OnSLTwitchBitsNoSync', [
    "OnSLTwitchBitsNoSync"
  ], controller.triggerCount);
  controller.triggerData[controller.triggerCount] = [
    ["FUNCTION", (msg) => {
      console.log("OnSLTwitchBitsNoSync");
      console.log(msg);
      if (msg.user == process.env.TWITCH_USER && !msg.data.isTest) {
        return false;
      }
      var test = msg.data.isTest;

      if (!test) {
        var newEvent = {
          listener: 'OnSLTwitchBitsNoSync',
          event: msg
        }
        dbManager.addEvent(newEvent);
      }

      dbManager.getWidgetData("streamboss")
        .then(data => {
          var points = msg.amount * data.bitsPoint;
          if (!test) {
            addViewerPoints(points, msg, data);
          }
          else {
            sendTestViewerEvent(points, msg, data);
          }
        });
    }]
  ];
  controller.triggerCount = controller.triggerCount + 1;

  // OnSLTwitchSubNoSync
  parserStreamlabs.addTriggerData('OnSLTwitchSubNoSync', [
    "OnSLTwitchSubNoSync"
  ], controller.triggerCount);
  controller.triggerData[controller.triggerCount] = [
    ["FUNCTION", (msg) => {
      console.log("OnSLTwitchSubNoSync");
      console.log(msg);
      if (msg.user == process.env.TWITCH_USER && !msg.data.isTest) {
        return false;
      }
      var test = msg.data.isTest;

      if (!test) {
        var newEvent = {
          listener: 'OnSLTwitchSubNoSync',
          event: msg
        }
        dbManager.addEvent(newEvent);
      }

      dbManager.getWidgetData("streamboss")
        .then(data => {
          var tier = msg.data.sub_plan === 'Prime' ? 1 : (parseInt(msg.data.sub_plan) / 1000);
          var multiplicator = tier < 3 ? tier : tier+2;
          var points = data.subscriptionPoint * multiplicator;
          if (!test) {
            addViewerPoints(points, msg, data);
          }
          else {
            sendTestViewerEvent(points, msg, data);
          }
        });
    }]
  ];
  controller.triggerCount = controller.triggerCount + 1;

  // OnSLTwitchCommunityGiftSubNoSync
  parserStreamlabs.addTriggerData('OnSLTwitchCommunityGiftSubNoSync', [
    "OnSLTwitchCommunityGiftSubNoSync"
  ], controller.triggerCount);
  controller.triggerData[controller.triggerCount] = [
    ["FUNCTION", (msg) => {
      console.log("OnSLTwitchCommunityGiftSubNoSync");
      console.log(msg);
      // var newEvent = {
      //   listener: 'OnSLTwitchCommunityGiftSubNoSync',
      //   event: msg
      // }
      // dbManager.addEvent(newEvent);

    }]
  ];
  controller.triggerCount = controller.triggerCount + 1;

  // OnSLTwitchGiftSubNoSync
  parserStreamlabs.addTriggerData('OnSLTwitchGiftSubNoSync', [
    "OnSLTwitchGiftSubNoSync"
  ], controller.triggerCount);
  controller.triggerData[controller.triggerCount] = [
    ["FUNCTION", (msg) => {
      console.log("OnSLTwitchGiftSubNoSync");
      console.log(msg);
      if (msg.gifter == process.env.TWITCH_USER && !msg.data.isTest) {
        return false;
      }
      var test = msg.data.isTest;

      if (!test) {
        var newEvent = {
          listener: 'OnSLTwitchGiftSubNoSync',
          event: msg
        }
        dbManager.addEvent(newEvent);
      }

      dbManager.getWidgetData("streamboss")
        .then(data => {
          var tier = msg.data.sub_plan === 'Prime' ? 1 : (parseInt(msg.data.sub_plan) / 1000);
          var multiplicator = tier < 3 ? tier : tier+2;
          var points = data.subscriptionPoint * multiplicator;
          var obj = {
            user: msg.gifter,
            data: {
              name: msg.data.gifter,
              display_name: msg.data.gifter_display_name
            }
          };
          if (!test) {
            addViewerPoints(points, obj, data);
          }
          else {
            sendTestViewerEvent(points, obj, data);
          }
        });
    }]
  ];
  controller.triggerCount = controller.triggerCount + 1;
}

if (parserTwitch) {
  // OnChannelPoint
  var channelPointName = process.env.REWARD_TRIGGER || 'Recompense 1';

  parserTwitch.addTriggerData('OnChannelPoint', [
    "OnChannelPoint",
    channelPointName
  ], controller.triggerCount);
  controller.triggerData[controller.triggerCount] = [
    ["FUNCTION", (msg) => {
      console.log("OnChannelPoint ", channelPointName);
      console.dir(msg, { depth: null });
      var test = msg.user == process.env.TWITCH_USER;

      if (!test) {
        var newEvent = {
          listener: 'OnChannelPoint',
          event: msg.data
        }
        dbManager.addEvent(newEvent);
      }

      dbManager.getWidgetData("streamboss")
        .then(data => {
          var points = data.rewardPoint;
          if (!test) {
            addViewerPoints(points, msg, data);
          }
          else {
            sendTestViewerEvent(points, msg, data);
          }
        });
    }]
  ];

  controller.triggerCount = controller.triggerCount + 1;


  parserTwitch.addTriggerData('OnChannelPoint', [
    "OnChannelPoint",
    "*"
  ], controller.triggerCount);
  controller.triggerData[controller.triggerCount] = [
    ["FUNCTION", (msg) => {
      console.log("OnChannelPoint *");
      console.dir(msg, { depth: null });
      if (msg.user == process.env.TWITCH_USER) {
        return false;
      }

      // var newEvent = {
      //   listener: 'OnChannelPoint',
      //   event: msg.data
      // }
      // dbManager.addEvent(newEvent);
      //
      // dbManager.getWidgetData("streamboss")
      //   .then(data => {
      //     var points = msg.data.redemption.reward.cost * data.rewardPoint;
      //     addViewerPoints(points, msg, data);
      //   });
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

function sendTestViewerEvent(points, userData, widgetData) {
  points = Math.ceil(points);
  userData.lastHit = points;
  userData.widgetCurrent = widgetData.current + points;
  io.emit("VIEWER_EVENT_TEST", userData);
}

function addViewerPoints(points, userData, widgetData) {
  dbManager.getViewer(userData.user)
    .then(viewer => {
      points = Math.ceil(points);
      if (viewer) {
        viewer.sessionPoints += points;
        viewer.points += points;
      }
      else {
        viewer = userData;
        viewer.sessionPoints = points;
        viewer.points = points;
        viewer.bossCount = 0;
      }

      viewer.lastHit = points;

      widgetData.current += points;
      if (widgetData.current >= widgetData.goal) {
        console.log("new streamBoss:", viewer.user);
        viewer.widgetCurrent = widgetData.goal;
        viewer.time = new Date();
        widgetData.boss = viewer;
        widgetData.bossHistory.push({
          user: viewer.user,
          sessionPoints: viewer.sessionPoints,
          points: viewer.points,
          time: new Date()
        });
        if (!viewer.bossCount) {
          viewer.bossCount = 0;
        }
        viewer.bossCount++;
        viewer.sessionPoints = 0;
        dbManager.updateViewer(viewer);
        dbManager.resetSessionLeaderboard(widgetData);
      }
      else {
        viewer.widgetCurrent = widgetData.current;
        dbManager.updateViewer(viewer);
        dbManager.updateWidgetData(widgetData);
      }
    });
}

function newDunk(success, fail) {
  dbManager.getWidgetData("crossket")
    .then(data => {
      if (success) {
        data.currentSuccess += success || 1;
        data.allTimeSuccess += success || 1;
      }
      if (fail) {
        data.currentFail += fail || 1;
        data.allTimeFail += fail || 1;
      }
      dbManager.updateWidgetData(data);
    });
}

function newSuccessfulDunk(number) {
  dbManager.getWidgetData("crossket")
    .then(data => {
      data.currentSuccess += number || 1;
      data.allTimeSuccess += number || 1;
      dbManager.updateWidgetData(data);
    });
}

function newFailDunk(number) {
  dbManager.getWidgetData("crossket")
    .then(data => {
      data.currentFail += number || 1;
      data.allTimeFail += number || 1;
      dbManager.updateWidgetData(data);
    });
}