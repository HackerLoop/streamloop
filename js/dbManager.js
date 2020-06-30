const MongoClient = require('mongodb').MongoClient;

// Database Name
const dbName = 'streamloopdb';

// Connection URL
const mongoDBurl = process.env.MONGODB_URI || `mongodb://localhost:27017/${dbName}`;

let db;
let users;
let settings;

(async () => {
  try {
    const client = await MongoClient.connect(mongoDBurl, { useNewUrlParser: true, useUnifiedTopology: true})
    db = client.db();
    users = db.collection('users');
    settings = db.collection('settings');
    console.log("mongodb Connected");
    users.findOne({}, function(err, result) {
      if (err) throw err;
      console.log(result);
    });
  } catch(err) {
    console.log(err);
  }
})();

const test = async () => {
  console.log("Hello");
}

module.exports = {
  test
}