# bn_twitterAPI

You just need to add your own config.js file to js folder and type npm install to install all modules and then npm start to start the app. Ctrl+c to close the app.  As you tweet your tweets will apear in the timeline section and it will be posted to twitter, but the app won't make another call to twitter unless you restart it.
The url is localhost:3000.

Your config.js file should look like this:
```
module.exports = ({
  consumer_key:         '....',
  consumer_secret:      '....',
  access_token:         '....',
  access_token_secret:  '....',
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
})
```
