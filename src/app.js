const express = require('express');
const app = express();
const morgan = require('morgan');
const querystring = require('querystring');
const axios = require('axios');
const util = require('util');
const fs = require('fs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
app.use(express.static(__dirname + '/public'));

app.use(morgan('dev'));

const redirectURI = 'auth/google';
const redirect = `${process.env.SERVER_ROOT_URI}/${redirectURI}`;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

//! google auth endpoints
/**
 * This is the url for starting off the authentication process.
 * Some query strings need to be appended for it to work.
 */
const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';

/**
 * This is the endpoint for accessing the user's info with the provided access_token.
 * The access token needs to be appended for it to work.
 */
const userinfoUrl = `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=`;

/**
 * This is the endpoint for getting the users acccess_token, refresh_token and id_token.
 */
const tokensUrl = 'https://oauth2.googleapis.com/token';

//!

// function objectToQueryString(obj) {
//   return Object.keys(obj)
//     .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
//     .join('&');
// }

const getGoogleAuthURL = () => {
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

  const values = {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirect,
    grant_type: 'authorization_code',
  };

  console.log(`\nGET TOKENS RDURL: ${redirectURI}`);

  var res;

  try {
    const response = await axios.post(
      tokensUrl,
      querystring.stringify(values),
      {
        headers: {
          'Content-Type': 'application/application/x-www-form-urlencoded',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.log('Failed to get auth token');
  }
}

async function getGoogleUser({ access_token, id_token }) {
  try {
    const response = await axios.get(`${userinfoUrl}${access_token}`, {
      headers: {
        Authorization: `Bearer ${id_token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to fetch user`);
    console.log(error.message);
  }
}

app.get('/auth', async (req, res, next) => {
  const { access_token, id_token } = req.query;
  // console.log(req.query);

  const user = await getGoogleUser({ access_token, id_token });

  if(!user) return res.set('Content-Type', 'text/html').send('<h1>An error occured</h1>');


  console.log(`User is ${util.inspect(user)}`);
  const jwt_secret = process.env.JWT_SECRET;

  const token = jwt.sign(user, jwt_secret);

  res.status(200).json({
    status: 'success',
    token
  })
});

app.get('/auth/google', async (req, res, next) => {
  const code = req.query.code;

  console.log(`Code is ${code}`);

  // request user token.
  const response = await getTokens(code); //getTokens  getAuthTokens
  const { access_token, refresh_token, id_token } = response;

  console.log({ access_token, refresh_token, id_token });

  // get user
  const user = await getGoogleUser({ access_token, id_token });

  console.log({ user });

  res.redirect(
    `${process.env.SERVER_ROOT_URI}/home?${querystring.stringify({
      name: user.given_name,
    })}`
  );
});

app.get('/home', async (req, res, next) => {
  const { name } = req.query;
  const path = __dirname + '/public/home.html';
  const readFile = util.promisify(fs.readFile);

  var home = await readFile(path, 'utf-8');
  home = home.replace('{{name}}', name);

  res.set('Content-Type', 'text/html');

  res.send(home);
});

app.get('/auth/google/url', (req, res, next) => {
  res.redirect(getGoogleAuthURL());
});

module.exports = app;
