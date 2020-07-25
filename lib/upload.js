'use strict';

const fs = require('fs');
const path = require('path');

const mimeTypesByExt = {
  /* eslint-disable -- custom object format */
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xlsm: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls:  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt:  'text/plain',
  html: 'text/html',
  htm:  'text/html',
  csv:  'text/csv',
  pdf:  'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  json: 'application/vnd.google-apps.script+json',
  jpeg: 'image/jpeg',
  jpg:  'image/jpeg',
  png:  'image/png',
  svg:  'image/svg+xml',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  pptm: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ppt:  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  /* eslint-enable */
};

module.exports = {
  _checkExistsDrive,
  mkDir,
  upload,
  _uploadFile,
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
 * @return {String|Bolean} Returns id of existing file/folder.
 * <code>false</code> otherwise
 * @access private
 */
async function _checkExistsDrive(fileMetadata) {
  const q =
    'name="' +
    fileMetadata.name +
    '" and mimeType="' +
    fileMetadata.mimeType +
    '" and "' +
    fileMetadata.parents[0] +
    '" in parents and trashed=false';
  const data = await this.listFiles({q: q});
  if (data) {
    if (data.files.length > 0) {
      return data.files[0].id;
    }
    return false;
  }
}

/**
 * Makes a new folder in Google Drive.
 * Overwrites existing folders.
 * @param {String} dirName - Name of folder to be created
 * @param {Object|String} [parentParams] - An object identifying where the
 * folder should be created with either
 * <code>parentId</code> or <code>parentName</code>.
 * Can also be a string containing the parent id.
 * Folder will be created in the root folder if this parameter isn't specified.
 * @return {String} Id of the folder created
 * @example
 * // make a new folder named "newFolder" in the folder "parentFolder"
 * utilsGDrive.mkDir("newFolder", {parentName: "parentFolder"});
 */
async function mkDir({dirName, parentId, parentName}) {
  const fileMetadata = {
    name: dirName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  let responseData;
  try {
    if (!parentId && !parentName) {
      parentId = 'root';
    } else {
      parentId = await this._resolveParamsId({parentId, parentName});
    }
    fileMetadata.parents = [parentId];
    const folderExists = await this._checkExistsDrive(fileMetadata);
    if (folderExists) this.del(folderExists);
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
 * Overwrites existing files/folders.
 * @param {String} localPath - Path to file or folder on disk
 * @param {Object|String} [parentParams] - An object identifying
 * where the file or folder should be uploaded with either
 * <code>parentId</code> or <code>parentName</code>.
 * Can also be a string containing the parent id.
 * File/folder will be uploaded to the root folder
 * if this parameter isn't specified.
 * @return {undefined} None
 * @example
 * // upload folder "folderName" to the folder "parentName" in Google Drive
 * utilsGDrive.upload("path/to/folderName", {parentName: "parentName"});
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
  };

  let fileId;
  // handle directories
  if (fs.lstatSync(localPath).isDirectory()) {
    let parentIdChildren;
    try {
      parentIdChildren = await this.mkDir(path.basename(localPath), {
        parentId,
      });
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
    const fileExistsDrive = await this._checkExistsDrive(fileMetadata);
    if (fileExistsDrive) this.del(fileExistsDrive);
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
