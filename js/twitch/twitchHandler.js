const Handler = require('../handler.js');
const Utils = require('../utils.js');
const PubSubWebsocket = require('./twitch-pub-socket');

class TwitchHandler extends Handler {
  /**
   * Create a new Timer handler.
   */
  constructor() {
    super('Twitch', ['OnChannelPoint', 'OnCommunityGoalStart', 'OnCommunityGoalProgress', 'OnCommunityGoalComplete', 'OnHypeTrainStart', 'OnHypeTrainEnd', 'OnHypeTrainLevel', 'OnHypeTrainProgress', 'OnHypeTrainConductor', 'OnHypeTrainCooldownExpired']);
    this.rewards = [];
    this.rewardsTrigger = {};
    this.goals = [];
    this.goalsTrigger = {};
    this.complete = [];
    this.completeTrigger = {};
    this.start = [];
    this.startTrigger = {};
    this.hypeTrains = [];
    this.hypeTrainsTrigger = {};
    this.hypeTrainsMap = {
      'onhypetrainstart': 'start',
      'onhypetrainend': 'end',
      'onhypetrainlevel': 'level',
      'onhypetrainprogress': 'progress',
      'onhypetrainconductor': 'conductor',
      'onhypetraincooldownexpired': 'cooldown'
    };
    this.currentConductor = {
      'SUBS': '',
      'CHEER': ''
    }
  }

  /**
   * Initialize the oauth tokens
   */
  async init(channelId) {
    PubSubWebsocket.connect(channelId, this.onMessage.bind(this));
  }

  /**
   * Register trigger from user input.
   * @param {string} trigger name to use for the handler
   * @param {array} triggerLine contents of trigger line
   * @param {number} id of the new trigger
   */
  addTriggerData(trigger, triggerLine, triggerId) {
    trigger = trigger.toLowerCase();
    switch (trigger.toLowerCase()) {
      case 'onchannelpoint':
        var reward = triggerLine.slice(1).join(' ');
        if (this.rewards.indexOf(reward) !== -1) {
          this.rewardsTrigger[reward].push(triggerId);
        } else {
          this.rewardsTrigger[reward] = [];
          this.rewards.push(reward);
          this.rewardsTrigger[reward].push(triggerId);
        }
        break;
      case 'oncommunitygoalprogress':
        var goal = triggerLine.slice(1).join(' ');
        if (this.goals.indexOf(goal) !== -1) {
          this.goalsTrigger[goal].push(triggerId);
        } else {
          this.goalsTrigger[goal] = [];
          this.goals.push(goal);
          this.goalsTrigger[goal].push(triggerId);
        }
        break;
      case 'oncommunitygoalcomplete':
        var goal = triggerLine.slice(1).join(' ');
        if (this.complete.indexOf(goal) !== -1) {
          this.completeTrigger[goal].push(triggerId);
        } else {
          this.completeTrigger[goal] = [];
          this.complete.push(goal);
          this.completeTrigger[goal].push(triggerId);
        }
        break;
      case 'oncommunitygoalstart':
        var goal = triggerLine.slice(1).join(' ');
        if (this.start.indexOf(goal) !== -1) {
          this.startTrigger[goal].push(triggerId);
        } else {
          this.startTrigger[goal] = [];
          this.start.push(goal);
          this.startTrigger[goal].push(triggerId);
        }
        break;
      case 'onhypetrainstart':
      case 'onhypetrainend':
      case 'onhypetrainconductor':
      case 'onhypetrainlevel':
      case 'onhypetrainprogress':
        var key = this.hypeTrainsMap[trigger];
        if (this.hypeTrains.indexOf(key) !== -1) {
          this.hypeTrainsTrigger[key].push(triggerId);
        } else {
          this.hypeTrainsTrigger[key] = [];
          this.hypeTrains.push(key);
          this.hypeTrainsTrigger[key].push(triggerId);
        }
        break;
    }
    return;
  }

  onMessage(message) {
    if (message.data) {
      var data = JSON.parse(message.data);
      // console.log(data);
      if (data.type === 'RESPONSE' && data.error === '') {
        this.success();
      } else if (data.type == 'MESSAGE' && data.data.topic.startsWith('community-points-channel-v1.')) {
        var dataMessage = JSON.parse(data.data.message);
        if (dataMessage.type === 'reward-redeemed') {
          this.onChannelPointMessage(dataMessage);
        } else if (dataMessage.type === 'community-goal-contribution' || dataMessage.type === 'community-goal-updated') {
          this.onCommunityGoalMessage(dataMessage);
        }
      } else if (data.type == 'MESSAGE' && data.data.topic.startsWith('hype-train-events-v1.')) {
        // this.onHypeTrainMessage(JSON.parse(data.data.message));
      }
    }
  }

  /**
   * Handle event messages from twitch pubsub websocket for channel points.
   * @param {Object} message twitch channel point data
   */
  onChannelPointMessage(message) {

    // Check if tracking reward
    var reward = message.data.redemption.reward.title;
    if (this.rewards.indexOf(reward) !== -1) {

      // Grab data to return
      var user = message.data.redemption.user.display_name;
      var input = '';
      if ('undefined' !== typeof(message.data.redemption.user_input)) {
        input = message.data.redemption.user_input;
      }

      // Handle triggers
      this.rewardsTrigger[reward].forEach(triggerId => {
        controller.handleData(triggerId, {
          user: user,
          message: input,
          data: message
        });
      })
    }
    if (this.rewards.indexOf('*') !== -1) {
      // Grab data to return
      var user = message.data.redemption.user.display_name;
      var input = '';
      if ('undefined' !== typeof(message.data.redemption.user_input)) {
        input = message.data.redemption.user_input;
      }

      // Handle triggers
      this.rewardsTrigger['*'].forEach(triggerId => {
        controller.handleData(triggerId, {
          user: user,
          message: input,
          data: message
        });
      })
    }
  }


  /**
   * Handle event messages from twitch pubsub websocket for community goals.
   * @param {Object} message twitch community goal data
   */
  onCommunityGoalMessage(message) {
    if (message.type === 'community-goal-contribution') {
      // Check if tracking goal
      var goal = message.data.contribution.goal.title;
      if (this.goals.indexOf(goal) !== -1) {
        // Handle triggers
        this.goalsTrigger[goal].forEach(triggerId => {
          controller.handleData(triggerId, {
            goal: goal,
            user: message.data.contribution.user.display_name,
            amount: message.data.contribution.amount,
            user_total: message.data.contribution.total_contribution,
            progress: message.data.contribution.goal.points_contributed,
            total: message.data.contribution.goal.goal_amount,
            data: message
          });
        });
      }
      if (this.goals.indexOf('*') !== -1) {
        this.goalsTrigger[goal].forEach(triggerId => {
          controller.handleData(triggerId, {
            goal: goal,
            user: message.data.contribution.user.display_name,
            amount: message.data.contribution.amount,
            user_total: message.data.contribution.total_contribution,
            progress: message.data.contribution.goal.points_contributed,
            total: message.data.contribution.goal.goal_amount,
            data: message
          });
        });
      }
      if (this.complete.indexOf(goal) !== -1) {
        var goal = message.data.contribution.goal.title;
        if (message.data.contribution.goal.status === 'ENDED' && message.data.contribution.total_contribution === message.data.contribution.goal.points_contributed) {
          // Handle triggers
          this.completeTrigger[goal].forEach(triggerId => {
            controller.handleData(triggerId, {
              goal: goal,
              user: user,
              amount: message.data.contribution.amount,
              user_total: message.data.contribution.total_contribution,
              progress: message.data.contribution.goal.points_contributed,
              total: message.data.contribution.goal.goal_amount,
              data: message
            });
          });
        }
      }
      if (this.complete.indexOf('*') !== -1) {
        // Handle triggers
        this.completeTrigger[goal].forEach(triggerId => {
          controller.handleData(triggerId, {
            goal: goal,
            user: user,
            amount: message.data.contribution.amount,
            user_total: message.data.contribution.total_contribution,
            progress: message.data.contribution.goal.points_contributed,
            total: message.data.contribution.goal.goal_amount,
            data: message
          });
        });
      }
    } else if (message.type === 'community-goal-updated') {
      var goal = message.data.community_goal.title;
      if (this.start.indexOf(goal) !== -1) {
        if (message.data.community_goal.status === 'STARTED' && message.data.community_goal.points_contributed === 0) {
          // Handle triggers
          this.startTrigger[goal].forEach(triggerId => {
            controller.handleData(triggerId, {
              goal: goal,
              data: message
            });
          });
        }
      }
      if (this.start.indexOf('*') !== -1) {
        // Handle triggers
        this.startTrigger[goal].forEach(triggerId => {
          controller.handleData(triggerId, {
            goal: goal,
            data: message
          });
        });
      }
    }
  }

  /**
   * Handle hype train messages from twitch pubsub websocket.
   * @param {Object} message twitch hype train data
   */
  async onHypeTrainMessage(message) {
    if (message.type === 'hype-train-start') {
      this.currentConductor = {
        'SUBS': '',
        'CHEER': ''
      };
      // Handle triggers
      this.hypeTrainsTrigger['start'].forEach(triggerId => {
        controller.handleData(triggerId, {
          data: message.data
        });
      });
    } else if (message.type === 'hype-train-end') {
      // Handle triggers
      this.hypeTrainsTrigger['end'].forEach(triggerId => {
        controller.handleData(triggerId, {
          sub_conductor_id: this.currentConductor['SUBS'],
          cheer_conductor_id: this.currentConductor['CHEER'],
          data: message.data
        });
      });
    } else if (message.type === 'hype-train-conductor-update') {
      // Handle triggers
      this.currentConductor[message.data.source] = message.data.user.id;
      this.hypeTrainsTrigger['conductor'].forEach(triggerId => {
        controller.handleData(triggerId, {
          sub_conductor_id: this.currentConductor['SUBS'],
          cheer_conductor_id: this.currentConductor['CHEER'],
          type: message.data.source,
          data: message.data
        });
      });
    } else if (message.type === 'hype-train-progression') {
      // Handle triggers
      this.hypeTrainsTrigger['progress'].forEach(triggerId => {
        controller.handleData(triggerId, {
          user_id: message.data.user_id,
          level: message.data.progress.level.value,
          progress: message.data.progress.total,
          total: message.data.progress.level.goal,
          time: message.data.progress.remaining_seconds,
          data: message.data
        });
      });
    } else if (message.type === 'hype-train-level-up') {
      // Handle triggers
      this.hypeTrainsTrigger['level'].forEach(triggerId => {
        controller.handleData(triggerId, {
          level: message.data.progress.level.value,
          progress: message.data.progress.total,
          total: message.data.progress.level.goal,
          time: message.data.progress.remaining_seconds,
          data: message.data
        });
      });
    } else if (message.type === 'hype-train-cooldown-expiration') {
      this.hypeTrainsTrigger['cooldown'].forEach(triggerId => {
        controller.handleData(triggerId);
      });
    }
  }
}

/**
 * Create a handler and read user settings
 */
function twitchHandlerExport() {
  var channelPoint = new TwitchHandler();
  Utils.getIdFromUser(process.env.TWITCH_USER, function (id) {
    channelPoint.init(id);
  })
}
twitchHandlerExport();