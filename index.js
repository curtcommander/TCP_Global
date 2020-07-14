#!/usr/bin/env node
'use strict';

const utils = require('./lib/utils');
const download = require('./lib/download');

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

class utilsGDrive {
    constructor() {
        this.SCOPES     = SCOPES,
        this.TOKEN_PATH = TOKEN_PATH, 
        this.CREDS_PATH = CREDS_PATH,
        this.LOG        = LOG
    }
    
    api                  = utils.api;
    listFiles            = utils.listFiles;
    getFiles             = utils.getFiles;
    getFileId            = utils.getFileId;
    getFileName          = utils.getFileName; 
    listChildren         = utils.listChildren;
    listChildrenFileId   = utils.listChildrenFileId; 
    listChildrenFileName = utils.listChildrenFileName;
    
    downloadFile         = download.downloadFile;
    downloadFileId       = download.downloadFileId;
    downloadFileName     = download.downloadFileName;
}

module.exports = new utilsGDrive();