
const express = require('express');
const config = require('./config.js');
const moment = require('moment');
const Twit = require('twit');
const bodyParser = require('body-parser');
const app = express();
const errFriends = new Error('Looks like we have an error in the friends function!');
const errTweet = new Error('Looks like we have an error in the tweets function');
const errMessages = new Error('Looks like we have an error in the messages function');
const errRecieved = new Error('Looks like we have an error in the recieved function');


app.use(bodyParser.urlencoded({ extended: false }));
app.use('/static', express.static('public'));
const T = new Twit(config);

app.set('view engine', 'pug');

/*---------------------------------------------
Create an error function to pass into all functions
each function to have its own error message
-------------------------------------------------*/

const error = (mes) => {
  console.error(mes);
  throw err;
};

/*----------------------------------------
Get all info from twitter with twit and get it ready for express
make sure create functions to pass into the express
-------------------------------------------*/

// Get profile information verify account

const profile = (req, res, next) => {
  T.get('account/verify_credentials', { skip_status: true })
    .catch((err) => {
      console.log('caught error at getting credintials', err.stack)
    })
    .then( (result) => {
      req.info = result.data;
      //console.log(info);
    })// end of get profile then
    setTimeout(next, 1000);
}; // end of profile function

// get 5 most recent friends

const friends = (req, res, next) => {
  T.get('friends/list', { screen_name: req.info.screen_name, count: 9, include_user_entities: false }, (err, data, response) => {
    if (err) {
      error(errFriends);
    }else {
       req.friendsList = data.users;
      //console.log(req.friendsList);
    }
  }) // end of get friends list
   setTimeout(next, 2000);
};// end of friends function


// get the 5 most recent tweets

const tweets = (req, res, next) => {
  T.get('statuses/user_timeline', { screen_name: req.info.screen_name, count: 9 }, (err, data, response) => {
    if (err) {
      error(errTweet);
    }else {
      req.tweet = data;
      //console.log(req.tweet);
      }
    });// end of get tweets
    setTimeout(next, 1000);
};// end of tweet function


  // get 5 private messages sent

const messages = (req, res, next) => {
   T.get('direct_messages/sent', {screen_name: req.info.screen_name, count: 5}, (err, data, response) => {
     if (err) {
       error(errMessages);
     }else {
       req.message = data;
     console.log(data);
     }
   }); // end of get messages
   setTimeout(next, 1500);
};// end of dirMessages

// Get 5 messages recieved

const recieved = (req, res, next) => {
   T.get('direct_messages', {screen_name: req.info.screen_name, count: 5}, (err, data, response) => {
     if (err) {
       error(errRecieved);
     }else {
       req.recMessage = data;
       //console.log(data);
   }
 }); // end of get messages
   setTimeout(next, 1500);
};// end of dirMessages


/*---------------------------------------------
load all functions into express with the app.use
-----------------------------------------------*/
app.use(profile, tweets, friends, messages, recieved);

 app.get('/', (req, res) => {
   let timeStamp = moment(req.tweet.created_at).format('lll');
   let messageStamp = moment(req.message.created_at).format('lll');
   res.render('index', {
     profile: req.info,
     tweets: req.tweet,
     friends: req.friendsList,
     timeStamp: timeStamp,
     messages: req.message,
     messageStamp: messageStamp,
     recievedMessage: req.recMessage

   }); // end of render

 }) // end of app.get





app.listen(3000, () => {
  console.log('The application is running on localhost:3000.');
});
