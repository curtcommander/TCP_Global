'use strict';

const fs = require('fs');
const path = require('path');

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

module.exports = {
  _checkExistsDrive,
  mkDir,
  upload,
  _uploadFile
};

/**
 * Checks if a file or folder exists in Google Drive
 * at the location specified.
 * @param {Object} fileMetadata - An object with the properties
 * <code>name</code>, <code>mimeType</code>, and <code>parents</code>.
 * <code>parents</code> is a list with a single string corresponding
 * to the parent id.
 * @throws Throws an error if a file or folder with the same name, MIME
 * type, and parent is found.
 * @return {undefined} None
 * @access private
 */
async function _checkExistsDrive(fileMetadata) {
  const q = 'name="'+fileMetadata.name+
    '" and mimeType="'+fileMetadata.mimeType+
    '" and "'+fileMetadata.parents[0]+'" in parents and trashed=false';
  const data = await this.listFiles({q: q});
  if (data) {
    if (data.files.length > 0) {
      throw new this.Error('File/folder already exists in drive.');
    }
  }
}

/**
 * Makes a folder in Google Drive.
 * Default location is <code>'root'</code> if parent not specified.
 * @param {String} dirName - Name of folder to be created
 * @param {Object} [parentParams] - An object identifying where the
 * folder should be created with either
 * <code>parentId</code> or <code>parentName</code>
 * @return {String} - Id of the folder created
 * @example
 * // make a new folder named "New Folder" in the folder "Parent Folder"
 * utilsGDrive.mkDir("New Folder", {parentName: "Parent Folder"});
 */
async function mkDir(dirName, parentParams = {}) {
  const fileMetadata = {
    'name': dirName,
    'mimeType': 'application/vnd.google-apps.folder',
  };
  
  if (parentParams === {}) parentParams.parentId = 'root';
  let responseData;
  try {
    const parentId = await this._resolveParamsId(parentParams);
    fileMetadata.parents = [parentId];
    await this._checkExistsDrive(fileMetadata);
    responseData = await this.api('files', 'create', {
      resource: fileMetadata,
      fields: 'id',
    });
  } catch (err) {
    return console.error(err);
  }
  return responseData.id;
}

/**
 * Uploads a file or folder to Google Drive.
 * Default location is <code>'root'</code> if parent not specified.
 * @param {String} localPath - Path to file or folder on disk
 * @param {Object} [parentParams] - An object identifying where the
 * file or folder should be uploaded with either
 * <code>parentId</code> or <code>parentName</code>
 * @return {undefined} None
 * @example
 * // upload folder "foo" to the folder "bar" in Google Drive
 * utilsGDrive.upload("./lorem/foo", {parentName: "bar"});
 */
async function upload(localPath, parentParams = {}) {
  const fileName = path.basename(localPath);
  let parentId;
  try {
    parentId = await this._resolveParamsId(parentParams);
  } catch (err) {
    return console.error(err);
  }
  const isDir = fs.lstatSync(localPath).isDirectory();

  let mimeType;
  if (isDir) {
    mimeType = 'application/vnd.google-apps.folder';
  } else {
    mimeType = mimeTypesByExt[path.extname(localPath).slice(1)];
  }

  const fileMetadata = {
    name: fileName,
    mimeType,
    parents: [parentId],
  }
  
  try {
    await this._checkExistsDrive(fileMetadata);
  } catch (err) {
    return console.error(err);
  }

  let fileId;
  // handle directories
  if (fs.lstatSync(localPath).isDirectory()) {
    let parentIdChildren;
    try {
      parentIdChildren = await this.mkDir(path.basename(localPath), {parentId}); 
    } catch (err) {
      return console.error(err);
    }
    fileId = parentIdChildren;
    const children = fs.readdirSync(localPath);
    for (const child of children) {
      const localPathChild = path.join(localPath, child);
      await this.upload(localPathChild, {
        parentId: parentIdChildren,
      });
    }
  // handle files
  } else {
    fileId = await this._uploadFile(localPath, fileMetadata);
  }

  return fileId;
}

/**
 * Uploads a file.
 * @param {String} localPath - Path to file or folder on disk
 * @param {Object} fileMetadata - An object with the properties
 * <code>name</code>, <code>mimeType</code>, and <code>parents</code>.
 * <code>parents</code> is a list with a single string corresponding
 * to the parent id.
 * @param {utilsGDrive} utilsGDrive - An instance of <code>utilsGDrive</code>
 * @return {undefined} None
 * @access private
 */
async function _uploadFile(localPath, fileMetadata) {
  const media = {
    mimeType: fileMetadata.mimeType,
    body: fs.createReadStream(localPath),
  };
  let responseData;
  try {
    responseData = await this.api('files', 'create', {
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });
  } catch (err) {
    return console.error(err);
  }
  return responseData.id;
}
