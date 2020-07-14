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

module.exports = {uploadFile};

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
  const fileName = params.filePath.slice(idxSlash);
  const fileMetadata = {name: fileName};

  // media
  const media = {
    mimeType: mimeType,
    body: fs.createReadStream(params.filePath),
  };

  await utils._collapseParamsToId(params);
  params.parentId = params.filePathId;
  delete params.filePathId;
  const fileNotExistsDrive = await _checkFileExistsDrive(params.parentId);
  if (fileNotExistsDrive) _upload(this);

  /**
   * Checks if file to be uploaded to Google Drive already exists
   * at the location specified.
   * @param {String} parentId - Id of the directory where
   * the file is to be uploaded
   * @return {Boolean} - Boolean representing whether file exists
   * @throws Throws error when the file to be uploaded is found in
   * folder with id `parentId`
   * @access private
  */
  async function _checkFileExistsDrive(parentId) {
    const q = 'name="'+fileName+'" and mimeType="'+mimeType+
      '" and "'+parentId+'" in parents and trashed=false';
    const data = await utils.listFiles({q: q}, drive);
    if (data.files.length) {
      return console.error(new Error('File already exists in drive.'));
    }
    fileMetadata.parents = [parentId];
    return true;
  }

  /**
  * Makes request to API to upload file using `fileMetadata`
  * and `media` in outer function `uploadFile`.
  * @param {utilsGDrive} utilsGDriveThis - Instance of utilsGDrive
  * @return {void} - None
  * @access private
  */
  function _upload(utilsGDriveThis) {
    utilsGDriveThis.drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'name, id, parents',
    }, (error) => {
      if (error) return console.error(error);
      console.log(fileName, 'created');
    },
    );
  }
}
