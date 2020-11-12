'use strict';

const fs = require('fs');
const path = require('path');

module.exports = {
  download,
  _downloadFile,
};

/**
 * Downloads a file or folder from Google Drive.
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
 * @return {undefined} None
 * @example
 * // download the folder "folderName" to the local directory "localDir"
 * utilsGDrive.download({fileName: "folderName"}, "path/to/localDir");
 *
 * // download the file with id "fileId" to the current working directory
 * utilsGDrive.download("fileId");
 */
async function download(identifiers, out = '.') {
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
    fs.mkdirSync(out);
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
        );
      }
    }
  // handle file
  } else {
    // error while downloading a file doesn't stop execution
    try {
      await this._downloadFile(fileId, fileName, out);
    } catch (e) {
      console.error(
          `Error while downloading file with id ${fileId} (${fileName})`);
      console.error(e);
    }
  }
}

/**
 * Downloads a file from Google Drive.
 * @param {string} fileId - File id
 * @param {string} fileName - File name
 * @param {string} out - Path to download location
 * @return {undefined} None
 * @access private
 */
function _downloadFile(fileId, fileName, out) {
  const dest = fs.createWriteStream(path.join(out, fileName));
  return new Promise((resolve) => {
    this.throttle(() => {
      this.drive.files.get(
          {fileId, alt: 'media'},
          {responseType: 'stream'},
          (err, resp) => {
            if (err) throw err;
            resp.data
                .on('error', (err) => {
                  throw err;
                })
                .on('end', () => {
                  resolve();
                })
                .pipe(dest);
          });
    });
  });
}
