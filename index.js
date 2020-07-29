#!/usr/bin/env node
'use strict';

const utils = require('./lib/utils');
const download = require('./lib/download');
const upload = require('./lib/upload');
const del = require('./lib/delete');
const update = require('./lib/update');
const drive = require('./lib/drive');

class UtilsGDriveError extends Error {
  constructor(args) {
    super(args);
    this.name = 'UtilsGDriveError';
  }
};

/**
 * Base class whose methods are utils-google-drive functions.
 * An instance of this class is returned when requiring the package.
 */
class utilsGDrive {    
    api                 = drive._addDrive(utils.api, this);
    _resolveId         = utils._resolveId;
    _resolveIdFromString = utils._resolveIdFromString;
    _handleListFilesResponse = utils._handleListFilesResponse;
    listFiles           = utils.listFiles;
    getFiles            = utils.getFiles;
    updateFiles         = utils.updateFiles;
    getFileId           = utils.getFileId;
    getFileName         = utils.getFileName;
    getMime             = utils.getMime;
    listChildren        = utils.listChildren;
    download            = drive._addDrive(download.download, this);
    _downloadFile       = download._downloadFile;
    _overwrite          = upload._overwrite;

    makeFolder          = upload.makeFolder;
    makeFolder          = upload.makeFolder;
    upload              = upload.upload;
    _uploadFile         = upload._uploadFile;

    del                 = del.del;
    rename              = update.rename;
    move                = update.move;

    Error               = UtilsGDriveError;
};

module.exports = new utilsGDrive();
