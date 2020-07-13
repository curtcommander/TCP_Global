#!/usr/bin/env node
'use strict';

const config = require('./config');
const utils = require('./utils');
const download = require('./download');

class utilsGDrive {
    constructor() {
        this.SCOPES     = config.SCOPES;
        this.TOKEN_PATH = config.TOKEN_PATH, 
        this.CREDS_PATH = config.CREDS_PATH,
        this.LOG        = config.LOG
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