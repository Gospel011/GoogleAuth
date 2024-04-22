const express = require('express');
const app = express();
const morgan = require('morgan');
require('dotenv').config();
app.use(express.static(__dirname + '/public'));

app.use(morgan('dev'));

const redirectURI = 'auth/google';

function objectToQueryString(obj) {
  return Object.keys(obj)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join('&');
}

const getGoogleAuthURL = () => {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: `${process.env.SERVER_ROOT_URI}/${redirectURI}`,
    client_id: process.env.CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
  };

  console.log(objectToQueryString(options));

  return `${rootUrl}?${objectToQueryString(options)}`;
};

app.get('/auth/google/url', (req, res, next) => {
  res.send(getGoogleAuthURL());
});

module.exports = app;
