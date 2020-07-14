'use strict';

const SCOPES = ['https://www.googleapis.com/auth/drive'];
const LOG = false;

let TOKEN_PATH = 'token.json';
let CREDS_PATH = 'credentials.json';
let entryPoint;
Object.keys(require.cache).map((key) => {
  const cacheEntry = require.cache[key];
  if (cacheEntry.filename.indexOf('/utils-gdrive/index.js') !== -1) {
    entryPoint = cacheEntry.path;
  }
});
TOKEN_PATH = entryPoint + '/' + TOKEN_PATH;
CREDS_PATH = entryPoint + '/' + CREDS_PATH;

module.exports = {SCOPES, LOG, TOKEN_PATH, CREDS_PATH};
