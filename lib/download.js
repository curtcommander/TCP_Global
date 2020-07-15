'use strict';

const fs = require('fs');
const drive = require('./drive');
const utils = require('./utils');

downloadFile = drive._addDrive(downloadFile);

module.exports = {downloadFile, downloadFileId, downloadFileName};

/**
 * Downloads a file from Google Drive.
 * @param {Object} params - An object with either `fileId` or `fileName`
 * and optionally `out`, the file's download location. If `out` is not
 * specified, the file will be placed in the current working directory.
 * @return {void} - None
 * @this utilsGDrive
 * @example donwloadFile({fileName: 'report.txt', out: Reports/report'})
 */
async function downloadFile(params) {
  await utils._collapseParamsToId(params);
  const metadata = await _getFileMetadata(params.fileId);
  // folder specified, throw error
  if (metadata.mimeType === 'application/vnd.google-apps.folder') {
    return console.error(new Error('A directory was specified.'));
  }
  // download file
  if (!params.out) params.out = '.';
  const dest = fs.createWriteStream(params.out+'/'+metadata.fileName);
  this.drive.files.get(
      {fileId: metadata.fileId, alt: 'media'}, {responseType: 'stream'},
      (error, response) => {
        if (error) return console.error(error);
        response.data
            .on('end', () => {
              console.log('Downloaded', metadata.fileName);
            })
            .on('error', (error) => {
              console.log('Error while downloading',
                  metadata.fileName+':', error);
            })
            .pipe(dest);
      });
}

/**
 * Gets file metadata (id, name, and MIME type).
 * @param {String} fileId - File id
 * @return {Object} - Object with `id`, `name`, and `mimeType`
 * @access private
 */
async function _getFileMetadata(fileId) {
  const data = await utils.getFiles({fileId, fields: 'name, id, mimeType'});
  const metadata = {
    fileId: data.id,
    fileName: data.name,
    mimeType: data.mimeType,
  };
  return metadata;
}

/**
 * Downloads a file given file id. Wraps `downloadFile`.
 * @param {String} fileId - File id
 * @param {*} out - Download location
 * @return {void} - None
 */
function downloadFileId(fileId, out) {
  return downloadFile({fileId, out});
}

/**
 * Downloads a file given file name. Wraps `donwloadFile`.
 * @param {String} fileName - File name
 * @param {*} out - Download location
 * @return {void} - None
 */
function downloadFileName(fileName, out) {
  return downloadFile({fileName, out});
}
