'use strict';

const fs = require('fs');
const path = require('path');

module.exports = {
  download,
  _downloadFile,
};

/**
 * Downloads a file or folder from Google Drive.
 * When downloading a folder, errors for individual files/folders
 * don't stop execution. They are listed under a single error
 * that is thrown at the end of execution if any errors did occur.
 * @param {Object|string} identifiers - An object
 * used to identify a file or folder. Must have either
 * <code>fileId</code> or <code>fileName</code>.
 * Also accepts a string containing the file/folder
 * id or path (can be partial) to the file/folder in Google Drive
 * @param {string} identifiers.fileId - File/folder id
 * @param {string} identifiers.fileName - File/folder name
 * @param {string} [identifiers.parentId] - Parent id
 * @param {string} [identifiers.parentName] - Parent name
 * @param {string} [out="."] - Path to download location
 * @param {Object} [errors] - Internal parameter
 * @return {Promise<undefined>} None
 * @example
 * // download the folder "folderName" to the local directory "localDir"
 * utilsGDrive.download({fileName: "folderName"}, "path/to/localDir");
 *
 * // download the file with id "fileId" to the current working directory
 * utilsGDrive.download("fileId");
 */
async function download(identifiers, out = '.', errors) {
  if (!errors) errors = [];

  // file id
  let fileId;
  if (identifiers.fileId) {
    fileId = identifiers.fileId;
  } else {
    fileId = await this._resolveId(identifiers);
  }

  // file name and MIME type
  let fileName;
  let mimeType;
  if (identifiers.fileName && identifiers.mimeType) {
    fileName = identifiers.fileName;
    mimeType = identifiers.mimeType;
  } else {
    const metadata = await this.getFiles({
      fileId, fields: 'name, mimeType',
    });
    fileName = metadata.name;
    mimeType = metadata.mimeType;
  }

  // write location
  if (!out) out = '.';

  // handle folder
  if (mimeType === 'application/vnd.google-apps.folder') {
    out = path.join(out, fileName);
    let flagError;
    try {
      fs.mkdirSync(out);
    } catch (err) {
      if (err.code !== 'EEXIST') {
        flagError = true;
        errors.push({
          path: out,
          id: fileId,
          error: err.stack,
          response: undefined,
        });
      }
    }

    if (!flagError) {
      const children = await this.listChildren({fileId});
      if (children) {
        for (const child of children) {
          await this.download(
              {
                fileId: child.id,
                fileName: child.name,
                mimeType: child.mimeType,
              },
              out,
              errors,
          );
        }
      }
    }
  // handle file
  } else {
    // error while downloading a file doesn't stop execution
    try {
      await this._downloadFile(fileId, fileName, out);
    } catch (err) {
      errors.push({
        path: out === '.' ? fileName : out+'/'+fileName,
        id: fileId,
        error: err.stack,
        response: err.response ? err.response : undefined,
      });
    }
  }
  // construct error message
  if (errors.length > 0) {
    const err = new Error(
        'Some files/folders weren\'t downloaded successfully. See list below.');
    for (const file of errors) {
      err.stack += '\n\n' + file.path;
      if (file.response) {
        err.stack +=
          `\nResponse: ${file.response.status} ${file.response.statusText}`;
      }
      err.stack += '\n' + file.error;
    }
    throw err;
  }
}

/**
 * Downloads a file from Google Drive.
 * @param {string} fileId - File id
 * @param {string} fileName - File name
 * @param {string} out - Path to download location
 * @return {Promise<undefined>} None
 * @access private
 */
function _downloadFile(fileId, fileName, out) {
  const dest = fs.createWriteStream(path.join(out, fileName));
  return new Promise((resolve, reject) => {
    return this.throttle(() => {
      return this.drive.files.get(
          {fileId, alt: 'media'},
          {responseType: 'stream'},
          (err, resp) => {
            if (err) {
              /* eslint-disable prefer-promise-reject-errors */
              return reject({
                stack: err.stack,
                response: err.response,
              });
              /* eslint-enable prefer-promise-reject-errors */
            }
            resp.data
                .on('error', (err) => {
                  return reject(err);
                })
                .on('end', () => {
                  resolve();
                })
                .pipe(dest);
          });
    });
  });
}
