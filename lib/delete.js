#!/usr/bin/env node
'use strict';

const drive = require('./drive');
const utils = require('./utils');

deleteFile = drive._addDrive(deleteFile);

module.exports = {
  deleteFile,
  deleteFileId,
  deleteFileNameParentId,
  deleteFileNameParentName,
};

/**
 * Deletes a file in Google drive.
 * @param {Object} paramsFile - An object identifying the file
 * to be deleted with either `fileId` or `fileName`
 * @param {Object} [paramsParent] - An object identifying the parent
 * of the file to be deleted with either `parentId` or `parentName`
 * @return {void} - None
 * @this {utilsGDrive}
 */
async function deleteFile(paramsFile, paramsParent = {}) {
  if (!paramsFile.fileId && paramsFile.fileName) {
    paramsFile.fileId = await utils.getFileId(paramsFile.fileName, paramsParent);
  }
  await this.drive.files.delete({fileId: paramsFile.fileId}, (error) => {
    if (error) return console.error(error);
    console.log(paramsFile.fileId, 'has been deleted');
  });
}

/**
 * Deletes a file in Google Drive given file id.
 * Wraps `deleteFile`.
 * @param {String} fileId - Id of file to be deleted
 * @return {void} - None
 */
function deleteFileId(fileId) {
  return deleteFile({fileId});
}

/**
 * Deletes a file in Google Drive given file name and id of parent.
 * Wraps `deleteFile`.
 * @param {String} fileName - Name of file to be deleted
 * @param {String} parentId - Id of file to be deleted's parent
 * @return {void} - None
 */
function deleteFileNameParentId(fileName, parentId) {
  return deleteFile({fileName}, {parentId});
}

/**
 * Deletes a file in Google Drive given file name and parent name.
 * Wraps `deleteFile`.
 * @param {String} fileName - Name of file to be deleted
 * @param {String} parentName - Name of file to be deleted's parent
 * @return {void} - None
 */
function deleteFileNameParentName(fileName, parentName) {
  return deleteFile({fileName}, {parentName});
}
