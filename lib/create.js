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

module.exports = {
  uploadFile,
  uploadFileParentId,
  uploadFileParentName,
  mkDir,
  mkDirParentId,
  mkDirParentName,
};

/**
 * Uploads a file to Google Drive. File's upload location defaults to 'root'
 * if no parent specified.
 * @param {String} filePath - Location on disk of the file to be upload
 * @param {Object} [paramsParent] - An object identifying where the
 * file should be uploaded with either `parentId` or `parentName`
 * * `parentId` - Id of the parent directory in Google Drive where
 * the file should be uploaded
 * * `parentName` - Name of the parent directory in Google Drive where
 * the file should be uploaded
 * * @this {utilsGDrive}
 * @return {String} - Id of file uploaded
 */
async function uploadFile(filePath, paramsParent = {}) {
  // mimeType
  const idxDot = filePath.lastIndexOf('.');
  if (idxDot == -1) {
    return console.error(new Error(
        'Name of file to be uploaded didn\'t include file extension.'));
  }
  const ext = filePath.slice(idxDot+1);
  const mimeType = mimeTypesByExt[ext];

  // file metadata
  let idxSlash = filePath.lastIndexOf('/');
  if (idxSlash == -1) idxSlash = 0;
  const fileName = filePath.slice(idxSlash+1);
  const fileMetadata = {name: fileName};

  // media
  const media = {
    mimeType: mimeType,
    body: fs.createReadStream(filePath),
  };

  if (paramsParent === {}) paramsParent.parentId = 'root';
  await utils._collapseParamsToId(paramsParent);
  fileMetadata.parents = [paramsParent.parentId];
  const fileNotExistsDrive = await _checkExistsDrive(fileMetadata);
  return new Promise((resolve, reject) => {
    if (fileNotExistsDrive) {
      this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id',
      }, (error, responseData) => {
        if (error) reject(new Error(error));
        console.log(fileName, 'created');
        resolve(responseData.data.id);
      });
    }
  });
}

/**
 * Uploads file to Google Drive given file's location on disk
 * and id of parent. Wraps `uploadFile`.
 * @param {*} filePath - Location on disk of the file to be upload
 * @param {*} parentId - Id of parent where the file is to be uploaded
 * @return {String} - Id of uploaded file
 */
function uploadFileParentId(filePath, parentId) {
  return uploadFile(filePath, {parentId});
}

/**
 * Uploads file to Google Drive given file's location on disk
 * and id of parent. Wraps `uploadFile`.
 * @param {String} filePath - Location on disk of the file to be upload
 * @param {String} parentName - Name of parent where the file is to be uploaded
 * @return {String} - Id of uploaded file
 */
function uploadFileParentName(filePath, parentName) {
  return uploadFile(filePath, {parentName});
}

/**
 * Makes a directory in Google Drive.
 * Default location for creating the directory is `root`
 * if parent not specified.
 * @param {String} dirName - Name of directory to be created
 * @param {Object} [paramsParent] - An object identifying where the
 * directory should be created with either `parentId` or `parentName`
 * * `parentId` - Id of the parent directory in Google Drive where
 * the directory should be created
 * * `parentName` - Name of the parent directory in Google Drive where
 * the directory should be created
 * @return {String} - Id of the directory created
 * @this {utilsGDrive}
 */
async function mkDir(dirName, paramsParent = {}) {
  const fileMetadata = {
    'name': dirName,
    'mimeType': 'application/vnd.google-apps.folder',
  };

  if (paramsParent === {}) paramsParent.parentId = 'root';
  await utils._collapseParamsToId(paramsParent);
  fileMetadata.parents = [paramsParent.parentId];
  const fileNotExistsDrive = await _checkExistsDrive(fileMetadata);
  return new Promise((resolve, reject) => {
    if (fileNotExistsDrive) {
      this.drive.files.create({
        resource: fileMetadata,
        fields: 'id',
      }, (error, responseData) => {
        if (error) reject(new Error(error));
        resolve(responseData.data.id);
      });
    }
  });
}

/**
 * Makes a directory in Google Drive given name
 * of directory and id of parent. Wraps `mkDir`.
 * @param {String} dirName - Name of diretory to be created
 * @param {String} parentId - Id of parent directory where the directory should be created
 * @return {String} - Id of the directory created
 */
function mkDirParentId(dirName, parentId) {
  return mkDir(dirName, {parentId});
}

/**
 * Makes a directory in Google Drive given name
 * of directory and name of parent. Wraps `mkDir`.
 * @param {String} dirName - Name of directory to be created
 * @param {String} parentName - Name of parent directory where the directory should be created
 * @return {String} - Id of the directory created
 */
function mkDirParentName(dirName, parentName) {
  return mkDir(dirName, {parentName});
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