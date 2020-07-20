'use strict';

const fs = require('fs');
const drive = require('./drive');
const utils = require('./utils');

download = drive._addDrive(download);

module.exports = {
  download,
  downloadFId,
  downloadFNamePId,
  downloadFNamePName
};

/**
 * Downloads a file or folder from Google Drive.
 * @param {Object} identifiers - An object identifying the file/folder
 * with either <code>fileId</code>/<code>folderId</code>
 * or <code>fileName</code>/<code>folderName</code>.
 * <code>parentId</code> and <code>parentName</code> properties may
 * also be included
 * @param {String} [out] - Path to download location
 * @return {void} None
 * @example
 * // download the folder "Folder Name" to the local directory "Local Dir"  
 * utilsGDrive.Download({folderName: "Folder Name"}, "Local Dir");
 */
async function download(identifiers, out = './') {
  // file id
  let fileId;
  if (identifiers.fileId) {
    fileId = identifiers.fileId;
  } else {
    fileId = await utils._resolveFId(identifiers);
  }

  // file name and MIME type
  let fileName, mimeType;
  if (identifiers.fileName && identifiers.mimeType) {
    fileName = identifiers.fileName;
    mimeType = identifiers.mimeType;
  } else {
    const metadata = await utils.getFiles({
      fileId,
      fields: 'name, mimeType',
    })
    fileName = metadata.name;
    mimeType = metadata.mimeType;
  }
  // write location
  if (!out) out = '.';

  // pass utilsGDrive through resursive function calls
  if (!identifiers.drive) {
    identifiers.utilsGDrive = this;
  }

  // handle folder
  if (mimeType === 'application/vnd.google-apps.folder') {
    out += '/'+fileName;
    try {
      fs.mkdirSync(out);
    } catch (e) {
      if (e.code !== 'EEXIST') {
        throw e;
      }
    }
    const children = await utils.listChildrenFId(fileId);
    for (const child of children) {
      await download({
        fileId: child.id,
        fileName: child.name,
        mimeType: child.mimeType,
        utilsGDrive: identifiers.utilsGDrive,
      }, out);
    }
  // handle file
  } else {
    await _downloadFile(fileId, fileName, out, identifiers.utilsGDrive);
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
async function _downloadFile(fileId, fileName, out, utilsGDrive) {
  const dest = fs.createWriteStream(out+'/'+fileName);
  utilsGDrive.drive.files.get({fileId, alt: 'media'}, {responseType: 'stream'},
  (error, response) => {
    if (error) return console.error(error);
    response.data
      .on('end', () => {
        console.log('Downloaded', fileName);
      })
      .on('error', (error) => {
        console.log('Error while downloading', fileName+':', error);
      })
      .pipe(dest);
    }
  )
}

/**
 * Downloads file/folder given id.
 * @see Wraps {@link download}
 * @param {String} fileId - File/folder id
 * @param {String} [out] - Path to download location
 * @return {void} None
 * @example
 * // download file with the id "XXX_FILE_ID_XXX" to current working directory
 * utilsGDrive.downloadFId("XXX_FILE_ID_XXX");
 */
function downloadFId(fileId, out = './') {
  return download({fileId}, out);
}

/**
 * Downloads a file/folder given file/folder name
 * and parent id.
 * @see Wraps {@link download}
 * @param {String} fileName - File/folder name
 * @param {String} [parentId] - Parent id
 * @param {String} [out] - Path to download location
 * @return {void} None
 * @example
 * // download file "File Name" in folder with id "XXX_FOLDER_ID_XXX"
 * downloadFNamePId("File Name", "XXX_FOLDER_ID_XXX");
 */
function downloadFNamePId(fileName, parentId, out = './') {
  if (!parentId) return download({fileName}, out);
  return download({fileName, parentId}, out);
}

/**
 * Downloads a file/folder given file/folder name
 * and parent name.
 * @see Wraps {@link download}
 * @param {String} fileName - File id
 * @param {String} [parentName] - Parent name
 * @param {String} [out] - Path to download location
 * @return {void} None
 * @example
 * // download file "File Name" in folder "Folder Name"
 * utilsGDrive.downloadFNamePName("File Name", "Folder Name");
 */
function downloadFNamePName(fileName, parentName, out = './') {
  if (!parentName) return download({fileName}, out);
  return download({fileName, parentName}, out);
}