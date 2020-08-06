let socketio;

const MongoClient = require('mongodb').MongoClient;

// Database Name
const dbName = 'streamloopdb';

// Connection URL
const mongoDBurl = process.env.MONGODB_URI || `mongodb://localhost:27017/${dbName}`;

let db;
let Widgets;
let Events;
let Viewers;

/*
event
{
  user_id: userID
  detail: {
    listener: 'se-donation-latest',
    event: msg.data
  }
}
*/

(async () => {
  try {
    const client = await MongoClient.connect(mongoDBurl, { useNewUrlParser: true, useUnifiedTopology: true})
    db = client.db();
    Widgets = db.collection('widgets');
    Events = db.collection('events');
    Viewers = db.collection('viewers');
    console.log("mongodb Connected", mongoDBurl);
    // Users.findOne({}, function(err, result) {
    //   if (err) throw err;
    //   console.log(result);
    // });
  } catch(err) {
    console.log(err);
  }
})();

const init = async (io) => {
  socketio = io; //we don't care which client is connected because we only broadcast
  try {
    let eventList = await Events.find().sort({ _id: -1 }).toArray();
    let widgetsData = await Widgets.find().toArray();
    let viewersList = await Viewers.find({}, {
      sort: {sessionPoints: -1}
    }).toArray();
    if (socketio) {
      socketio.emit("EVENT_LIST", eventList);
      socketio.emit("WIDGETS_DATA", widgetsData);
      socketio.emit("VIEWERS_LIST", viewersList);
    }
  } catch(err) {
    //console.log(err);
  }
}

const addEvent = async (eventData) => {
  // do stuff for progress bar and goal here

  try {
    var dbEvent = await Events.insertOne(eventData);
    let newEvent = await Events.findOne({_id: dbEvent.insertedId});
    let eventList = await Events.find().sort({ _id: -1 }).toArray();
    if (socketio) {
      socketio.emit("EVENT_LIST", eventList);
      socketio.emit("EVENT", newEvent);
    }
  } catch(err) {
    //console.log(err);
  }
}

// const getUsers = async () => {
//   let usersList = await users.find().toArray();
//   return usersList;
// }

const getViewer = async (username) => {
  let data = await Viewers.findOne({user: username});
  return data;
}

const updateViewer = async (data) => {
  // console.log("updateViewerData", data);
  if (data._id) {
    delete data._id;
  }
  try {
    await Viewers.updateOne({user: data.user}, {$set: data}, {upsert: true});
    let ViewersData = await Viewers.find({}, {
      sort: {sessionPoints: -1}
    }).toArray();
    if (socketio) {
      socketio.emit("VIEWERS_LIST", ViewersData);
    }
  } catch(err) {
    console.log(err);
  }
}

const resetSessionLeaderboard = async (obj) => {
  // console.log(obj);
  obj.current = 0;
  try {
    await Viewers.updateMany({}, {$set: {
      sessionPoints: 0
    }});
    let ViewersData = await Viewers.find({}, {
      sort: {sessionPoints: -1}
    }).toArray();
    if (socketio) {
      socketio.emit("VIEWERS_LIST", ViewersData);
    }
    updateWidgetData(obj);
  } catch(err) {
    console.log(err);
  }
}

const getWidgetData = async (widgetName) => {
  let data = await Widgets.findOne({name: widgetName});
  return data;
}

const updateWidgetData = async (data) => {
  // console.log("updateWidgetData", data);
  if (data._id) {
    delete data._id;
  }
  try {
    await Widgets.updateOne({name: data.name}, {$set: data});
    let widgetsData = await Widgets.find().toArray();
    if (socketio) {
      socketio.emit("WIDGETS_DATA", widgetsData);
    }
  } catch(err) {
    console.log(err);
  }
}

module.exports = {
  init,
  addEvent,
  getWidgetData,
  updateWidgetData,
  getViewer,
  updateViewer,
  resetSessionLeaderboard
}