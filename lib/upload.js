'use strict';

const fs = require('fs');
const path = require('path');
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

upload = drive._addDrive(upload);
mkDir = drive._addDrive(mkDir);

module.exports = {
  mkDir,
  upload,
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
  const data = await utils.listFiles({q: q});
  if (data.files.length) {
    throw new Error('File/folder already exists in drive.');
  }
  return;
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
  const parentId = await utils._resolveParamsId(parentParams);
  fileMetadata.parents = [parentId];
  await _checkExistsDrive(fileMetadata);
  return new Promise((resolve, reject) => {
    this.drive.files.create({
      resource: fileMetadata,
      fields: 'id',
    }, (error, responseData) => {
      if (error) reject(new Error(error));
      resolve(responseData.data.id);
    });
  });
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
  if (!parentParams.utilsGDrive) parentParams.utilsGDrive = this;

  // check if file/folder exists in drive
  const fileName = path.basename(localPath)
  const parentId = await utils._resolveParamsId(parentParams);
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
    parents: [parentId]
  }
  
  await _checkExistsDrive(fileMetadata);
  // handle directories
  if (fs.lstatSync(localPath).isDirectory()) {
    const parentIdChildren = await mkDir(path.basename(localPath), {parentId});
    const children = fs.readdirSync(localPath);
    for (const child of children) {
      const localPathChild = localPath+'/'+child;
      await upload(localPathChild, {
        parentId: parentIdChildren,
        utilsGDrive: parentParams.utilsGDrive});
    }
  // handle files
  } else {
    await _uploadFile(localPath, fileMetadata, parentParams.utilsGDrive)
  }
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
async function _uploadFile(localPath, fileMetadata, utilsGDrive) {
  const media = {
    mimeType: fileMetadata.mimeType,
    body: fs.createReadStream(localPath),
  };
  return new Promise((resolve, reject) => {
    utilsGDrive.drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    }, (error, responseData) => {
      if (error) reject(new Error(error));
      console.log(fileMetadata.name, 'created');
      resolve(responseData.data.id);
    });
  });
}
