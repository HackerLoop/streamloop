const WebSocket = require('ws');
const Utils = require('../utils.js');

/**
 * Connect to the Twitch PubSub websocket and setup the event handlers
 * @param {string} channelId twitch channel id
 * @param {function} onMessage method to call when events are received
 */
exports.connect = function(channelId, onMessage) {
	// Create the websocket connection
	var socket = new WebSocket('wss://pubsub-edge.twitch.tv');

	var nonce = Utils.randomString(18);

	// WS OnOpen event : authenticate
	socket.onopen = function() {
		// Create authentication payload and request required events
		var auth = {
			"type": "LISTEN",
			"nonce": nonce,
			"data": {
				"topics": [
					"community-points-channel-v1." + channelId,
					"hype-train-events-v1." + channelId
				],
			}
		};
		// Send authentication payload to Streamlabs Chatbot
		socket.send(JSON.stringify(auth));

		console.log(`Successfully connected to ${process.env.TWITCH_USER} Twitch websocket`);
	};

	setInterval(function() {
		socket.send(JSON.stringify({
			"type": "PING"
		}));
	}, 240000);

	// Ws OnClose : try reconnect
	socket.onclose = function() {
		socket = null;
		console.error('Twitch Pubsub Websocket Closed');
	};

	// WS OnMessage event : handle events
	socket.onmessage = onMessage;
};
