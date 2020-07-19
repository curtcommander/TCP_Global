#!/usr/bin/env node
'use strict';

const config = require('./config');
const utils = require('./lib/utils');
const down = require('./lib/download');
const create = require('./lib/create');
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
    
    downloadFile            = down.downloadFile;
    downloadFileId          = down.downloadFileId;
    downloadFileName        = down.downloadFileName;

    uploadFile              = create.uploadFile;
    uploadFilePId           = create.uploadFileParentId;
    uploadFilePName         = create.uploadFileParentName;
    mkDir                   = create.mkDir;
    mkDirPId                = create.mkDirParentId;
    mkDirPName              = create.mkDirParentName;

    deleteFile              = del.deleteFile;
    deleteFId               = del.deleteFileId;
    deleteFNamePId          = del.deleteFileNameParentId;
    deleteFNamePName        = del.deleteFileNameParentName;
}

module.exports = new utilsGDrive();