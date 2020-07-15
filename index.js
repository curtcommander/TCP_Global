#!/usr/bin/env node
'use strict';

const config = require('./config');
const utils = require('./lib/utils');
const download = require('./lib/download');
const create = require('./lib/create');
const deleteFile = require('./lib/deleteFile');

class utilsGDrive {
    constructor() {
        this.SCOPES     = config.SCOPES,
        this.TOKEN_PATH = config.TOKEN_PATH, 
        this.CREDS_PATH = config.CREDS_PATH,
        this.LOG        = config.LOG
    }
    
    api                       = utils.api;
    listFiles                 = utils.listFiles;
    getFiles                  = utils.getFiles;
    getFileId                 = utils.getFileId;
    getFileName               = utils.getFileName; 
    listChildren              = utils.listChildren;
    listChildrenFileId        = utils.listChildrenFileId; 
    listChildrenFileName      = utils.listChildrenFileName;
    
    downloadFile              = download.downloadFile;
    downloadFileId            = download.downloadFileId;
    downloadFileName          = download.downloadFileName;

    uploadFile                = create.uploadFile;
    mkDir                     = create.mkDir;

    deleteFile                = deleteFile.deleteFile;
    deleteFileId              = deleteFile.deleteFileId;
    deleteFileNameParentId    = deleteFile.deleteFileNameParentId;
    deleteFileNameParentName  = deleteFile.deleteFileNameParentName;
}

module.exports = new utilsGDrive();