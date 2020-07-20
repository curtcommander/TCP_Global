'use strict';

const fs = require('fs');
const path = require('path');
const drive = require('./drive');
const utils = require('./utils');
const { _resolveParamsId } = require('./utils');

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
  mkDirPId,
  mkDirPName,
  upload,
  uploadPId,
  uploadPName
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
 * @return {void} None
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
 * Makes a folder in Google Drive given name
 * of folder and id of parent.
 * @see Wraps {@link mkDir}
 * @param {String} dirName - Name of folder to be created
 * @param {String} [parentId] - Id of parent folder where the folder should be created
 * @return {String} - Id of the folder created
 * @example
 * // make a new folder named "New Folder" in the folder with id "XXX_PARENT_ID_XXX"
 * utilsGDrive.mkDirPId("New Folder", "XXX_PARENT_ID_XXX");
 */
function mkDirPId(dirName, parentId) {
  if (!parentId) return mkDir(dirName);
  return mkDir(dirName, {parentId});
}

/**
 * Makes a folder in Google Drive given name
 * of folder and name of parent.
 * @see Wraps {@link mkDir}
 * @param {String} dirName - Name of folder to be created
 * @param {String} [parentName] - Name of parent folder where the folder should be created
 * @return {String} - Id of the folder created
 * @example
 * // make a new folder named "New Folder" in the folder "Parent Folder"
 * utilsGDrive.mkDirPName("New Folder", "Parent Folder");
 */
function mkDirPName(dirName, parentName) {
  if (!parentName) return mkDir(dirName);
  return mkDir(dirName, {parentName});
}

/**
 * Uploads a file or folder to Google Drive.
 * Default location is <code>'root'</code> if parent not specified.
 * @param {String} localPath - Path to file or folder on disk
 * @param {Object} [parentParams] - An object identifying where the
 * file or folder should be uploaded with either
 * <code>parentId</code> or <code>parentName</code>
 * @return {void} None
 * @example
 * // upload folder "foo" to the folder "bar" in Google Drive
 * utilsGDrive.upload("./lorem/foo", {parentName: "bar"});
 */
async function upload(localPath, parentParams = {}) {
  if (!parentParams.utilsGDrive) parentParams.utilsGDrive = this;

  // check if file/folder exists in drive
  const fileName = path.basename(localPath)
  const parentId = await _resolveParamsId(parentParams);
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
  if (fs.lstatSync(localPath).isfolder()) {
    const parentIdChildren = await mkDirPId(path.basename(localPath), parentId);
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
 * @return {void} None
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

/**
 * Uploads a file or folder to Google Drive
 * given id of parent.
 * @see Wraps {@link upload}
 * @param {String} localPath - Path to file or folder on disk
 * @param {String} [parentId] - Id of folder to upload the
 * local file/folder to
 * @return {void} None
 * @example
 * // upload the folder "Folder Name" to the folder in Gooogle Drive
 * // with id "XXX_PARENT_ID_XXX"
 * utilsGDrive.uploadPId("Folder Name", "XXX_PARENT_ID_XXX");
 */
function uploadPId(localPath, parentId) {
  if (!parentId) return upload(localPath);
  return upload(localPath, {parentId});

}

/**
 * Uploads a file or folder to Google Drive
 * given name of parent.
 * @see Wraps {@link upload}
 * @param {String} localPath - Path to file or folder on disk
 * @param {String} [parentName] - Name of folder to upload
 * the local file/folder too
 * @return {void} None
 * @example
 * // upload the folder "Folder Name" to the 
 * // folder "Parent Folder" in Gooogle Drive
 * utilsGDrive.uploadPId("Folder Name", "Parent Folder");
 */
function uploadPName(localPath, parentName) {
  if (!parentName) return upload(localPath);
  return upload(localPath, {parentName});
}