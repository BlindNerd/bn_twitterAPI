'use strict'

const express = require('express');
const app = express();
const config = require('./config.js');
const moment = require('moment');
const Twit = require('twit');
const bodyParser = require('body-parser');
const http = require('http');
const server = require('http').Server(app);
const io = require('socket.io')(server);


  // Build up constructor to pass into app.use to save on twitter calls

let dmessages = [ ];
let message1 = [ ];
let myInfo = [ ];
let tweetMessage = [ ];
let friendsInfo = [ ];

// add the moment module to pug
app.locals.moment = require('moment');

app.use(bodyParser.urlencoded({ extended: false }));

// add the styles to the page and make the cleint side java script a js file to fix the error
app.use('/static', express.static('public'));
const T = new Twit(config);

app.set('view engine', 'pug');

/*----------------------------------------
Get all info from twitter with twit and get it ready for express
make sure create functions to pass into the express had to make them
there own functions to give the app time to retrieve
-------------------------------------------*/

function Me(name, screenName, image, friends, banner) {
  this.name = name;
  this.screenName = screenName;
  this.image = image;
  this.friendsCount = friends;
  this.banner = banner;
}

// Get profile information verify account
// Build a constructor to grab the screenName


  T.get('account/verify_credentials', { skip_status: true })
    .catch((err) => {
      console.log('caught error at getting credintials', err.stack)
    })
    .then( (result) => {
      let name = result.data.name;
      let screenName = result.data.screen_name;
      let image = result.data.profile_image_url;
      let friendsCount = result.data.friends_count;
      let banner = result.data.profile_banner_url;
myInfo = new Me(name, screenName, image, friendsCount, banner);
 })// end of get profile then


// get 5 most recent friends
function Friendcon(name, user, image){
  this.name = name;
  this.screenName = user;
  this.friendImage = image;
}

T.get('friends/list', { screen_name: Me.screenName, count: 9, include_user_entities: false }, (err, data, response) => {
    if (err) {
       const err = new Error('You made to many calls to Twitter,  wait a couple of minutes and try agian.');
       console.error(err);
       err.status = 500;
       throw err;
    }else {
    for (let i = 0; i < data.users.length; i++) {
      let friendsName = data.users[i].name;
      let friendsUser = data.users[i].screen_name;
      let friendsImage = data.users[i].profile_image_url;
      friendsInfo.push(new Friendcon(friendsName, friendsUser, friendsImage));
     } // end of loop
    }}); // end of get friends list

// build up tweet constructor

function TweetData(text, created, name, user, retweet, likes) {
  this.message = text;
  this.timeCreated = created;
  this.name = name;
  this.user = user;
  this.retweet = retweet;
  this.likes = likes;
}

// get the 5 most recent tweets when app loads

T.get('statuses/user_timeline', { screen_name: Me.screenName, count: 9 }, (err, data, response) => {
    if (err) {
      const err = new Error('Looks like we had a problem getting your tweets.');
      console.error(err);
      err.status = 500;
      throw err;
    }else {
    for (let i = 0; i < data.length; i++) {
       let tweetText = data[i].text;
       let tweetTime = data[i].created_at;
       let tweetCreated = moment(tweetTime, "ddd MMM HH:mm:ss Z YYYY").format("MM/DD/YYYY, HH:mm");
       let tweetName = data[i].user.name;
       let tweetUser = data[i].user.screen_name;
       let tweetRetweet = data[i].retweet_count;
       let tweetLikes = data[i].favorite_count;
  tweetMessage.push(new TweetData(tweetText, tweetCreated, tweetName, tweetUser, tweetRetweet, tweetLikes));
    }// end of loop
  }});// end of get tweets and else

// Build a constuctor function to handle the messages sent and recieved

  // This is the recieved messages contructor
function Rmessages(text, name, imageURL, timeCreated) {
  this.text = text;
  this.name = name;
  this.image = imageURL;
  this.time = timeCreated;
}
  // my sent messages contructor
function Messages(text, time) {
  this.text = text;
  this.time = time;
}

  // get 5 private messages sent

T.get('direct_messages/sent', {screen_name: Me.screenName, count: 5}, (err, data, response) => {
     if (err) {
       const err = new Error('Looks like we had a problem getting your sent messages.');
       console.error(err);
       err.status = 500;
       throw err;
     }else {
     for (let i = 0; i < data.length; i++) {
       let messageData = data[i].text;
       let messageTime1 = data[i].created_at;
       let messageTime = moment(messageTime1, "ddd MMM HH:mm:ss Z YYYY").format("MM/DD/YYYY, HH:mm");
    message1.push(new Messages(messageData, messageTime));
     }// end of loop
    }// end of else
   }); // end of get messages

// Get 5 messages recieved

T.get('direct_messages', {screen_name: Me.screenName}, (err, data, response) => {
     if (err) {
       const err = new Error('Looks like we had a problem getting your messages.');
       console.error(err);
       err.status = 500;
       next(err);
     }else {
    for (let i = 0; i < data.length; i++) {
      let rmessage = data[i].text;
      let sender = data[i].sender.name;
      let senderImage = data[i].sender.profile_image_url;
      let time1 = data[i].created_at;
      let time = moment(time1, "ddd MMM HH:mm:ss Z YYYY").format("MM/DD/YYYY, HH:mm");
      // build up each instance of recieved messages
    dmessages.push(new Rmessages(rmessage, sender, senderImage, time));
    }// end of loop
  }// end of else

 }); // end of get messages

/*---------------------------------------------
pass contructors into app.get so that pug can use
the data
-----------------------------------------------*/

app.get('/', (req, res) => {
   res.render('index', {myInfo, friendsInfo, tweetMessage, message1, dmessages})

 // open a conection to send this with socket

 io.on('connection', function (socket) {
   socket.emit('info', myInfo);
  });// end of connection
}); // end of app get

// recieve text from client to post to twitter
io.on('connection', function (socket) {
    socket.on('message', function (text) {
        let tweetText1 = text;
T.post('statuses/update', {status: tweetText1},(err, data, res) => {
   });// end of T.post
  }); // end of socket on
}); // end of app.post

// create a friendly page not found error to pass into the error handler
 app.use((req, res, next) => {
   const err = new Error('I\'m sorry that page does not exist.');
   err.status = 404;
   next(err);
 });// end of 404 error page

// make an error handler to pass errors through

 app.use( (err, req, res, next) => {
   res.locals.error = err;

   // had an error caused by one of the modules this was a workaround
  if ( res.status !== 404 ) {
    res.status = 500;
  }else {
   res.status(err.status)
 }
   res.render('error');
 });// end of error handler


server.listen(3000, () => {
  console.log('This application is running on localhost:3000.');
});
