#!/usr/bin/env node
'use strict';

const config = require('./config');
const utils = require('./lib/utils');
const download = require('./lib/download');
const upload = require('./lib/upload');
const del = require('./lib/delete');

/**
 * Base class whose methods are utils-google-drive functions.
 * An instance of this class is returned when requiring the package.
 */
class utilsGDrive {
    constructor() {
        this.SCOPES     = config.SCOPES,
        this.TOKEN_PATH = config.TOKEN_PATH, 
        this.CREDS_PATH = config.CREDS_PATH,
        this.LOG        = config.LOG
    }
    
    api                     = utils.api;
    listFiles               = utils.listFiles;
    getFiles                = utils.getFiles;
    getFileId               = utils.getFileId;
    getFileIdPId            = utils.getFileIdPId;
    getFileIdPName          = utils.getFileIdPName;
    getFileName             = utils.getFileName;
    getMime                 = utils.getMime;
    getMimeFId              = utils.getMimeFId;
    getMimeFNamePId         = utils.getMimeFNamePId;
    getMimeFNamePName       = utils.getMimeFNamePName;
    listChildren            = utils.listChildren;
    listChildrenFId         = utils.listChildrenFId; 
    listChildrenFNamePId    = utils.listChildrenFNamePId;
    listChildrenFNamePName  = utils.listChildrenFNamePName;
    
    download                = download.download;
    downloadFId             = download.downloadFId;
    downloadFNamePId        = download.downloadFNamePId;
    downloadFNamePName      = download.downloadFNamePName;

    mkDir                   = upload.mkDir;
    mkDirPId                = upload.mkDirPId;
    mkDirPName              = upload.mkDirPName;
    upload                  = upload.upload;
    uploadFilePId           = upload.uploadPId;
    uploadFilePName         = upload.uploadPName;

    deleteFile              = del.deleteFile;
    deleteFileFId           = del.deleteFileFId;
    deleteFileFNamePId      = del.deleteFileFNamePId;
    deleteFileFNamePName    = del.deleteFileFNamePName;
}

module.exports = new utilsGDrive();