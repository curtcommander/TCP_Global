'use strict';

const fs = require('fs');
const drive = require('./drive');
const utils = require('./utils');

const mimeTypesByExt = {
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'xlsm': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'xls': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'txt': 'text/plain',
  'html': 'text/html',
  'htm': 'text/html',
  'csv': 'text/csv',
  'pdf': 'application/pdf',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'json': 'application/vnd.google-apps.script+json',
  'jpeg': 'image/jpeg',
  'jpg': 'image/jpeg',
  'png': 'image/png',
  'svg': 'image/svg+xml',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'pptm': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'ppt': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

uploadFile = drive._addDrive(uploadFile);
mkDir = drive._addDrive(mkDir);

module.exports = {uploadFile, mkDir};

/**
 * Uploads a file to Google Drive.
 * @param {Object} params - An object with `filePath`
 *  and either `parentId` or `parentName`
 * * `filePath` - Location on disk of the file to be upload
 * * `parentId` - Id of the folder in Google Drive where
 * the file should be uploaded
 * * `parentName` - Name of the folder in Google Drive where
 * the file should be uploaded
 * @this {utilsGDrive}
 * @return {void} - None
 */
async function uploadFile(params) {
  // mimeType
  const idxDot = params.filePath.lastIndexOf('.');
  if (idxDot == -1) {
    return console.error(new Error(
        'Name of file to be uploaded didn\'t include file extension.'));
  }
  const ext = params.filePath.slice(idxDot+1);
  const mimeType = mimeTypesByExt[ext];

  // file metadata
  let idxSlash = params.filePath.lastIndexOf('/');
  if (idxSlash == -1) idxSlash = 0;
  const fileName = params.filePath.slice(idxSlash+1);
  const fileMetadata = {name: fileName};

  // media
  const media = {
    mimeType: mimeType,
    body: fs.createReadStream(params.filePath),
  };

  await utils._collapseParamsToId(params);
  fileMetadata.parents = [params.parentId];
  const fileNotExistsDrive = await _checkExistsDrive(fileMetadata);
  if (fileNotExistsDrive) {
    this.drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    }, (error, file) => {
      if (error) return console.error(error);
      console.log(fileName, 'created');
      return file.id;
    });
  }
}

/**
 * Makes a directory in Google Drive.
 * @param {Object} params - An object with `dirName`
 *  and either `parentId` or `parentName`
 * * `dirName` - Name of the directory to be created
 * * `parentId` - Id of the folder in Google Drive where
 * the file should be uploaded
 * * `parentName` - Name of the folder in Google Drive where
 * the file should be uploaded
 * @return {String} - Id of the directory created
 * @this {utilsGDrive}
 */
async function mkDir(params) {
  const fileMetadata = {
    'name': params.dirName,
    'mimeType': 'application/vnd.google-apps.folder',
  };

  await utils._collapseParamsToId(params);
  fileMetadata.parents = [params.parentId];
  const fileNotExistsDrive = await _checkExistsDrive(fileMetadata);
  if (fileNotExistsDrive) {
    this.drive.files.create({
      resource: fileMetadata,
      fields: 'id',
    }, (error, file) => {
      if (error) return console.error(error);
      return file.id;
    });
  }
}

/**
 * Checks if a file or directory exists in Google Drive
 * at the location specified.
 * @param {Object} fileMetadata - Id of the directory where
 * the file is to be uploaded
 * @return {Boolean} - Boolean representing whether file exists
 * @access private
 */
async function _checkExistsDrive(fileMetadata) {
  const q = 'name="'+fileMetadata.fileName+
    '" and mimeType="'+fileMetadata.mimeType+
    '" and "'+fileMetadata.parents[0]+'" in parents and trashed=false';
  const data = await utils.listFiles({q: q});
  if (data.files.length) {
    console.error(new Error('File already exists in drive.'));
    return false;
  }
  return true;
}
