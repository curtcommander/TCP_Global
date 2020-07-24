'use strict';

const fs = require('fs');
const path = require('path');

module.exports = {
  download,
  _downloadFile,
};

/**
 * Downloads a file or folder from Google Drive.
 * @param {Object} identifiers - An object identifying the file/folder
 * with either <code>fileId</code>/<code>folderId</code>
 * or <code>fileName</code>/<code>folderName</code>.
 * <code>parentId</code> and <code>parentName</code> properties may
 * also be included
 * @param {String} [out] - Path to download location
 * @return {undefined} None
 * @example
 * // download the folder "Folder Name" to the local directory "Local Dir"
 * utilsGDrive.Download({folderName: "Folder Name"}, "Local Dir");
 */
async function download(identifiers, out = '.') {
  // file id
  let fileId;
  if (identifiers.fileId) {
    fileId = identifiers.fileId;
  } else {
    try {
      fileId = await this._resolveFId(identifiers);
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
      fileId, fields: 'name, mimeType',
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
      const d = new Date();
      if (err.code === 'EEXIST') fs.utimesSync(out, d, d);
      else return console.error(err);
    }
    const children = await this.listChildren({fileId});
    if (children) {
      for (const child of children) {
        await this.download({
          fileId: child.id,
          fileName: child.name,
          mimeType: child.mimeType,
        }, out);
      }
    }
  // handle file
  } else {
    await this._downloadFile(fileId, fileName, out);
  }
}

/**
 * Downloads a file from Google Drive.
 * @param {String} fileId - File id
 * @param {String} fileName - File name
 * @param {String} [out] - Path to download location
 * @param {utilsGDrive} utilsGDrive - An instance of <code>
 * utilsGDrive</code>
 * @access private
 */
async function _downloadFile(fileId, fileName, out) {
  const dest = fs.createWriteStream(path.join(out, fileName));
  this.drive.files.get({fileId, alt: 'media'}, {responseType: 'stream'},
  (err, response) => {
    if (err) return console.error(err);
    response.data
      .on('error', (err) => {
        console.error('Error while downloading', fileName+':', err);
      })
      .pipe(dest);
    }
  )
}
