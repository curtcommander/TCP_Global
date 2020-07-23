'use strict';

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const config = require('../config');

module.exports = {_addDrive};

/**
 * Higher-order function that adds client object (`drive`) to instance
 * of utilsGDrive if not present and then executes `fn`.
 * @param {function} fn - Function to be executed
 * @param {utilsGDrive} utilsGDrive - Instance of utilsGDrive
 * @return {void} None
 * @access private
 */
function _addDrive(fn, utilsGDrive) {
  return async (...args) => {
    if (!utilsGDrive.drive) {
      utilsGDrive.drive = await _getDrive();
    }
    return fn.apply(utilsGDrive, args);
  };
}

/**
 * Gets and authenticates client object used to
 * interact with Google Drive API.
 * @return {google.auth.OAuth2} - Authenticated client object
 * @access private
 */
async function _getDrive() {
  const client = await _getClient();
  const token = await _getToken(client);
  client.setCredentials(token);
  const drive = google.drive({version: 'v3', auth: client});
  return drive;
}

/**
 * Instantiates client object with credentials
 * @return {google.auth.OAuth2} - Client object
 * @access private
 */
function _getClient() {
  const content = fs.readFileSync(config.CREDS_PATH);
  const credentials = JSON.parse(content);
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id,
      client_secret, redirect_uris[0]);
  return oAuth2Client;
}

/**
 * Gets token to authenticate client object
 * @param {google.auth.OAuth2} client - Client object
 * returned by `getClient`
 * @return {Object} - Token object
 * @access private
 */
function _getToken(client) {
  let token = _getTokenStored();
  if (!token) token = _getTokenAPI(client);
  return token;
}

/**
 * Gets locally-stored access token.
 * @return {Object|Boolean} - Returns token if found
 * and `false` if not
 * @access private
 */
function _getTokenStored() {
  try {
    const content = fs.readFileSync(config.TOKEN_PATH);
    const token = JSON.parse(content);
    return token;
  } catch (e) {
    if (e.code === 'ENOENT') {
      return false;
    } else {
      throw e;
    }
  }
}

/**
 * Gets token from Google and stores to disk.
 * @param {google.auth.OAuth2} client - Client object
 * @return {Object} - Token object
 * @access private
 */
function _getTokenAPI(client) {
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: config.SCOPES,
  });
  console.log('Authorize this app by visiting this url:\n\n'+authUrl+'\n');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      client.getToken(code, (error, token) => {
        if (error) throw new Error('Error retrieving access token:', error);
        // store token to disk for later program executions
        fs.writeFile(config.TOKEN_PATH, JSON.stringify(token), (error) => {
          if (error) {
            console.error(
                new Error('Error writing token to file:', error));
          }
          console.log('Token stored to', config.TOKEN_PATH);
          resolve(token);
        });
      });
    });
  });
}
