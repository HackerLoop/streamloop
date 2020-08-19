# Streamloop

## Getting started
`node index.js` or `npm start`

***

### Dashboard

`http://localhost:8080/[USER]/?secret=[APP_SECRET_TOKEN]`

***

### Twitch Channel Reward Trigger

Specify the twitch channel reward name or id in the env var
```
REWARD_TRIGGER='Recompense 1'
```

***

## API

### POST `/api/[user]/dunk/?secret=[APP_SECRET_TOKEN]`
```
header: 'Content-Type': 'application/json'

body: {
  "success": 1,
  "fail": 1
}
```
Add number of successful or failed dunks to the current counter.

***

### GET `/api/[user]/score`
Return number of Successful Dunk.

***

### GET `/api/[user]/king`
Return name of the current king.

***

## Help
Please see the [settings](https://github.com/Kruiser8/Kruiz-Control/blob/master/settings/Settings.md) description for more information.

## Thanks
- [Kruiz-Control](https://github.com/Kruiser8/Kruiz-Control/blob/master/README.md)