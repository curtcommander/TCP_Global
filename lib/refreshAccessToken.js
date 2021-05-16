#!/usr/bin/env node
'use strict';

const gaxios = require('gaxios');
const fs = require('fs');

const refreshEndpoint = 'https://accounts.google.com/o/oauth2/token';
const refreshTokenOpts = {
  url: refreshEndpoint,
  method: 'POST',
};

module.exports = _refreshAccessToken;

/**
 * Refreshes access token and updates tokenGDrive.json accordingly.
 * @param {UtilsGDive} utilsGDrive - instance of UtilsGDrive
 * @return {Promise<string>} New access token
 * @access private
 */
async function _refreshAccessToken(utilsGDrive) {
  refreshTokenOpts.body = JSON.stringify({
    /* eslint-disable */
    client_id: utilsGDrive.drive.permissions.context._options.auth._clientId,
    client_secret: utilsGDrive.drive.permissions.context._options.auth._clientSecret,
    refresh_token: utilsGDrive.drive.permissions.context._options.auth.credentials.refresh_token,
    grant_type: 'refresh_token',
    /* eslint-enable */
  });
  const res = await gaxios.request(refreshTokenOpts);
  const tokenGDrive = JSON.parse(fs.readFileSync('tokenGDrive.json'));
  tokenGDrive.access_token = res.data.access_token;
  const expiryDate = new Date().getTime() + res.data.expires_in - 60;
  tokenGDrive.expiry_date = expiryDate;
  fs.writeFileSync('tokenGDrive.json', JSON.stringify(tokenGDrive));
  return tokenGDrive.access_token;
}
