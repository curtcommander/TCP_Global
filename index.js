#!/usr/bin/env node
'use strict';

const config = require('./config');
const utils = require('./lib/utils');
const download = require('./lib/download');
const create = require('./lib/create');
const del = require('./lib/delete');

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
    uploadFileParentId        = create.uploadFileParentId;
    uploadFileParentName      = create.uploadFileParentName;
    mkDir                     = create.mkDir;
    mkDirParentId             = create.mkDirParentId;
    mkDirParentName           = create.mkDirParentName;

    deleteFile                = del.deleteFile;
    deleteFileId              = del.deleteFileId;
    deleteFileNameParentId    = del.deleteFileNameParentId;
    deleteFileNameParentName  = del.deleteFileNameParentName;
}

module.exports = new utilsGDrive();