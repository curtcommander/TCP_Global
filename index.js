#!/usr/bin/env node
'use strict';

const utils = require('./lib/utils');
const download = require('./lib/download');
const upload = require('./lib/upload');
const del = require('./lib/delete');
const update = require('./lib/update');
const drive = require('./lib/drive');

/**
 * Base class for utils-google-drive errors
 * which have the name UtilsGDriveError
 */
class UtilsGDriveError extends Error {
  /* eslint-disable-next-line require-jsdoc */
  constructor(args) {
    super(args);
    this.name = 'UtilsGDriveError';
  }
};

/**
 * Base class whose methods are utils-google-drive functions.
 * An instance of this class is returned when requiring the package.
 */
class UtilsGDrive {
  /* eslint-disable-next-line require-jsdoc */
  constructor() {
    /* eslint-disable no-multi-spaces */
    this.api                 = drive._addDrive(utils.api, this),
    this.listFiles           = utils.listFiles;
    this.getFiles            = utils.getFiles;
    this.updateFiles         = utils.updateFiles;
    this.getFileId           = utils.getFileId;
    this.getFileName         = utils.getFileName;
    this.getMime             = utils.getMime;
    this.listChildren        = utils.listChildren;
    this.download            = drive._addDrive(download.download, this);
    this._downloadFile       = download._downloadFile;
    this._overwrite          = upload._overwrite;

    this.makeFolder          = upload.makeFolder;
    this.makeFolder          = upload.makeFolder;
    this.upload              = upload.upload;
    this._uploadFile         = upload._uploadFile;

    this.del                 = del.del;
    this.rename              = update.rename;
    this.move                = update.move;

    this.Error                     = UtilsGDriveError;
    this._resolveId                = utils._resolveId;
    this._resolveIdFromString      = utils._resolveIdFromString;
    this._handleListFilesResponse  = utils._handleListFilesResponse;
    /* eslint-enable no-multi-spaces */
  };
};

module.exports = new UtilsGDrive();
