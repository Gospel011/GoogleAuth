const express = require('express');
const app = express();
const morgan = require('morgan');
const querystring = require('querystring');
const axios = require('axios');
const util = require('util');
const fs = require('fs');
// const {promisify} = require('promissify');
require('dotenv').config();
app.use(express.static(__dirname + '/public'));

app.use(morgan('dev'));

const redirectURI = 'auth/google';
const redirect = `${process.env.SERVER_ROOT_URI}/${redirectURI}`;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

// function objectToQueryString(obj) {
//   return Object.keys(obj)
//     .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
//     .join('&');
// }

const getGoogleAuthURL = () => {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';

  console.log(`::: R E D I R E C T   U R I  ${redirect}`);

  const options = {
    redirect_uri: redirect,
    client_id: process.env.CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
  };

  const url = `${rootUrl}?${querystring.stringify(options)}`;

  console.log(`:: URL:  ${url}`);

  return url;
};

// __________________________________________________________________

// ___________________________________________________________________

async function getTokens(code) {
  /*
   * Uses the code to get tokens
   * that can be used to fetch the user's profile
   */
  const url = 'https://oauth2.googleapis.com/token';
  const values = {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirect,
    grant_type: 'authorization_code',
  };

  console.log(`\nGET TOKENS RDURL: ${redirectURI}`);

  var res;

  //   try {
  res = await axios.post(url, querystring.stringify(values), {
    headers: {
      'Content-Type': 'application/application/x-www-form-urlencoded',
    },
  }).then((data) => {
    console.log("Data is", data);
  }).catch((error) => {
    console.log("Failed to get tokens")
  });

//   console.log('success response is', res.data);

  return res;
}

//*
async function getAuthTokens(code) {
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const data = {
    code: code,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    redirect_uri: redirectURI,
    grant_type: 'authorization_code',
  };

  axios
    .post(tokenUrl, querystring.stringify(data), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    .then((response) => {
      console.log('Access token:', response.data.access_token);
    })
    .catch((error) => {
      console.error('Error:', error.response.data);
    });
}

app.get('/auth/google', async (req, res, next) => {
  const code = req.query.code;

  console.log(`Code is ${code}`);

  const response = await getTokens(code); //getTokens  getAuthTokens

  // console.log('RES IS', response);
});

app.get('/auth/google/url', (req, res, next) => {
  res.redirect(getGoogleAuthURL());
});

module.exports = app;
