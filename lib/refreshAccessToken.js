#!/usr/bin/env node
'use strict';

const gaxios = require('gaxios');
const fs = require('fs');

const refreshEndpoint = 'https://accounts.google.com/o/oauth2/token';
const tokenGDrive = JSON.parse(fs.readFileSync('tokenGDrive.json'));
const credentialsGDrive = JSON.parse(
    fs.readFileSync('credentialsGDrive.json')).installed;
const refreshAccessTokenOpts = {
  url: refreshEndpoint,
  method: 'POST',
  body: JSON.stringify({
    'client_id': credentialsGDrive.client_id,
    'client_secret': credentialsGDrive.client_secret,
    'refresh_token': tokenGDrive.refresh_token,
    'grant_type': 'refresh_token',
  }),
};

module.exports = _refreshAccessToken;

/**
 * Refreshes access token and updates tokenGDrive.json accordingly.
 * @return {String} New access token
 */
async function _refreshAccessToken() {
  const res = await gaxios.request(refreshAccessTokenOpts);
  tokenGDrive.access_token = res.data.access_token;
  const expiryDate = new Date().getTime() + res.data.expires_in - 60;
  tokenGDrive.expiry_date = expiryDate;
  fs.writeFileSync('tokenGDrive.json', JSON.stringify(tokenGDrive));
  return tokenGDrive.access_token;
}
