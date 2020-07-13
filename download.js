'use strict';

const fs = require('fs');
const drive = require('./drive');
const utils = require('./utils');

downloadFile = drive._addDrive(downloadFile);

module.exports = {downloadFile, downloadFileId, downloadFileName};

/**
 * Downloads a file from Google Drive
 * @param {Object} params - An object with either `fileId` or `fileName`
 * and optionally `out`, the file's download location. If `out` is not
 * specified, the file will be placed in the current working directory.
 * @return {void} - None
 * @example donwloadFile({fileName: 'report.txt', out: Reports/report'})
 */
function downloadFile(params) {
  return utils._collapseparamsToId(params)
      .then(() => _getFileMetadata(params.fileId))
      .then((metadata) => _download(metadata));

  /**
   * Gets file metadata (id, name, and MIME type).
   * @param {String} fileId - File id
   * @return {Object} - Object with `id`, `name`, and `mimeType`
   * @access private
   */
  function _getFileMetadata(fileId) {
    return utils.getFiles({fileId, fields: 'name, id, mimeType'})
        .then((data) => {
          const metadata = {
            fileId: data.id,
            fileName: data.name,
            mimeType: data.mimeType,
          };
          return metadata;
        });
  }

  /**
   * Makes request to API to donwload file and writes it to `out`
   * @param {Object} metadata - Object returned by `_getFileMetadata`
   * @return {void} - None
   * @access private
   */
  function _download(metadata) {
    // folder specified, throw error
    if (metadata.mimeType === 'application/vnd.google-apps.folder') {
      throw new Error('A directory (rather than a file) was specified.');
    }
    // download file
    if (!params.out) params.out = '.';
    const dest = fs.createWriteStream(params.out+'/'+metadata.fileName);
    return this.drive.files.get(
        {fileId: metadata.fileId, alt: 'media'},
        {responseType: 'stream'},
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
