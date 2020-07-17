const fs = require('fs')
const axios = require('axios');

/**
 * Create a random string of the provided length.
 * @param {number} length string length to generate
 */
exports.randomString = function(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

/**
 * Read the file and send the data to the callback.
 * @param {string} file name of the file
 * @param {function} callback function to call with file data
 */
exports.readFile = function(file, callback) {
  fs.readFile(file, 'utf8', function (err,data) {
    if (err) {
      console.error(`Error reading the ${file} file! Please open the html in Microsoft Edge or your broadcasting software.`, err);
    }
    else {
      callback(data);
    }
  });
  // $.ajax({
  //   url: file,
  //   type: 'GET',
  //   dataType: 'text',
  //   success: function(data) {
  //     callback(data);
  //   },
  //   error: function(data) {
  //     console.error(`Error reading the ${file} file! Please open the html in Microsoft Edge or your broadcasting software.`);
  //   }
  // });
}

/**
 * Get the user's id and send to the callback.
 * @param {string} user name user
 * @param {function} callback function to call with file data
 */
exports.getIdFromUser = function(user, callback) {
  axios.get('https://decapi.me/twitch/id/' + user)
    .then(response => {
      callback(response.data);
    })
    .catch(error => {
      console.error(`Error getting the user id for ${user}! Please double-check that your user is spelled correctly.`, error);
    });
}

/**
 * Get the streamelements channel data and send to the callback.
 * @param {string} channel_id id channel
 * @param {function} callback function to call with file data
 */
exports.getSEChannelDataFromId = function(channel_id, callback) {

  axios.get('https://api.streamelements.com/kappa/v2/channels/' + channel_id)
    .then(response => {
      callback(response.data);
    })
    .catch(error => {
      console.error(`Error getting the channel data for ${channel_id}! Please double-check that your channel id is spelled correctly.`, error);
    });
}

/**
 * Get Twitch Channel data and send to the callback.
 * @param {string} channel_id id channel
 * @param {function} callback function to call with file data
 */
exports.getTwitchChannelDataFromId = function(channel_id, callback) {

  axios.get('https://api.twitch.tv/kraken/channel' + channel_id, {
    headers: {
      'Client-ID': process.env.TWITCH_CLIENT_ID
    }
  })
    .then(response => {
      callback(response.data);
    })
    .catch(error => {
      console.error(`Error getting the channel data for ${channel_id}! Please double-check that your channel id is spelled correctly.`, error);
    });
}

/**
 * Return a promise for the specified amount of milliseconds
 * @param {number} ms Milliseconds to wait in the promise
 */
exports.timeout = function(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}