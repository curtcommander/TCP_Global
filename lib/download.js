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
 * id or path (can be partial) to the file/folder in Google Drive.
 * @param {string} identifiers.fileId - File/folder id
 * @param {string} identifiers.fileName - File/folder name
 * @param {string} [identifiers.parentId] - Parent id
 * @param {string} [identifiers.parentName] - Parent name
 * @param {string} [out="."] - Path to download location
 * @return {undefined} None
 * @example
 * // download the folder "folderName" to the local directory "localDir"
 * utilsGDrive.download({folderName: "folderName"}, "path/to/localDir");
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
    try {
      fileId = await this._resolveId(identifiers);
    } catch (err) {
      return console.error(err);
    }
  }

  // file name and MIME type
  let fileName;
  let mimeType;
  if (identifiers.fileName && identifiers.mimeType) {
    fileName = identifiers.fileName;
    mimeType = identifiers.mimeType;
  } else {
    const metadata = await this.getFiles({
      fileId,
      fields: 'name, mimeType',
    });
    if (!metadata) return;
    fileName = metadata.name;
    mimeType = metadata.mimeType;
  }
  // write location
  if (!out) out = '.';

  // handle folder
  if (mimeType === 'application/vnd.google-apps.folder') {
    out = path.join(out, fileName);
    try {
      fs.mkdirSync(out);
    } catch (err) {
      return console.error(err);
    }
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
    await this._downloadFile(fileId, fileName, out);
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
    this.drive.files.get(
        {fileId, alt: 'media'},
        {responseType: 'stream'},
        (err, response) => {
          if (err) return console.error(err);
          response.data
              .on('error', (err) => {
                console.error('Error while downloading', fileName + ':', err);
              })
              .on('end', () => {
                resolve();
              })
              .pipe(dest);
        });
  });
}
