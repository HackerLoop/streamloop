let socketio;

const MongoClient = require('mongodb').MongoClient;

// Database Name
const dbName = 'streamloopdb';

// Connection URL
const mongoDBurl = process.env.MONGODB_URI || `mongodb://localhost:27017/${dbName}`;

let db;
let Widgets;
let Events;

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
    console.log("mongodb Connected");
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
    let eventList = await Events.find().toArray();
    let widgetsData = await Widgets.find().toArray();
    socketio.emit("EVENT_LIST", eventList);
    socketio.emit("WIDGETS_DATA", widgetsData);
  } catch(err) {
    console.log(err);
  }
}

const addEvent = async (eventData) => {
  // do stuff for progress bar and goal here

  try {
    var dbEvent = await Events.insertOne(eventData);
    let newEvent = await Events.findOne({_id: dbEvent.insertedId});
    let eventList = await Events.find().toArray();
    socketio.emit("EVENT_LIST", eventList);
    socketio.emit("EVENT", newEvent);
  } catch(err) {
    console.log(err);
  }
}

// const getUsers = async () => {
//   let usersList = await users.find().toArray();
//   return usersList;
// }


const getWidgetData = async (widgetName) => {
  let data = await Widgets.findOne({name: widgetName});
  return data;
}

const updateWidgetData = async (widgetName, data) => {
  try {
    await Widgets.updateOne({name: widgetName}, {$set: data});
    let widgetsData = await Widgets.find().toArray();
    socketio.emit("WIDGETS_DATA", widgetsData);
  } catch(err) {
    console.log(err);
  }
}

module.exports = {
  init,
  addEvent,
  getWidgetData,
  updateWidgetData
}