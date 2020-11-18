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
  _overwrite,
  makeFolder,
  upload,
  _uploadFile,
};

/**
 * Checks if a file or folder exists in Google Drive
 * at the location specified and deletes it if found.
 * @param {Object} fileMetadata - An object with the properties
 * <code>name</code>, <code>mimeType</code>, and <code>parents</code>.
 * <code>parents</code> is a list with a single string corresponding
 * to the parent id
 * @return {undefined} None
 * @access private
 */
async function _overwrite({name, mimeType, parents}) {
  const q = `name='${name}' and mimeType='${mimeType}'` +
    ` and '${parents[0]}' in parents and trashed=false`;
  const data = await this.listFiles({q: q});
  if (data) {
    if (data.files.length > 0) {
      this.del(data.files[0].id);
    }
  }
}

/**
 * Makes a new folder in Google Drive.
 * If both <code>params.parentId</code> and <code>params.parentName</code>
 * aren't specified, the folder will be created in the root folder.
 * @param {Object|string} params - Function parameters.
 * A string containing the name of the folder to be created may be passed
 * instead. In this case, the folder will be created at the root folder
 * @param {string} params.folderName - Name of folder to be created
 * @param {Object} [params.parentIdentifiers] - Same as
 * <code>identifiers</code> in other methods
 * (e.g. {@link getMime}) but for the parent folder where the
 * new folder will be created
 * @param {boolean} [params.overwrite] - Whether to overwrite
 * an existing folder. Default value is <code>false</code>
 * @return {string} Id of the folder created
 * @example
 * // make a new folder named "newFolder" in the folder "parentFolder"
 * utilsGDrive.makeFolder({
 *   folderName: "newFolder",
 *   parentIdentifiers: {fileName: "parentFolder"}
 * });
 *
 * // make a new folder named "newFolder" in the root folder
 * utilsGDrive.makeFolder("newFolder");
 */
async function makeFolder({
  folderName,
  parentIdentifiers = {},
  overwrite=false,
}) {
  if (typeof(arguments[0]) === 'string') {
    folderName = arguments[0];
  }

  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  const parentId = await this._resolveId(parentIdentifiers);
  fileMetadata.parents = [parentId];
  if (overwrite) this._overwrite(fileMetadata);
  const responseData = await this.api('files', 'create', {
    resource: fileMetadata,
    fields: 'id',
  });
  return responseData.id;
}

/**
 * Uploads a file or folder to Google Drive.
 * If both <code>params.parentId</code> and <code>params.parentName</code>
 * aren't specified, the file/folder will be uploaded at the root folder.
 * @param {Object|string} params - Function parameters.
 * A string containing the path to the file/folder to be uploaded may be passed
 * instead. In this case, the file/folder will be uploaded at the root folder
 * @param {string} params.localPath - Path to file or folder on disk
 * @param {Object} [params.parentIdentifiers] - Same as
 * <code>identifiers</code> in other methods
 * (e.g. {@link getMime}) but for the parent folder
 * where the file/folder is to be uploaded to
 * @param {boolean} [params.overwrite] - Whether to overwrite
 * existing files/folders. Default value is <code>false</code>
 * @return {undefined} None
 * @example
 * // upload folder "folderName" to the folder "parentName" in Google Drive
 * utilsGDrive.upload({
 *   localPath: "path/to/folderName",
 *   parentIdentifiers: {fileName: "parentFolder"}
 * });
 *
 * // upload folder "folderName" to the root folder
 * utilsGDrive.upload("path/to/folderName");
 */
async function upload({
  localPath,
  parentIdentifiers = {},
  overwrite=false,
}) {
  // parent id
  let parentId;
  if (typeof(arguments[0]) === 'string') {
    localPath = arguments[0];
    parentId = 'root';
  } else {
    parentId = await this._resolveId(parentIdentifiers);
  }

  // file name
  const fileName = path.basename(localPath);

  // MIME type
  const isDir = fs.lstatSync(localPath).isDirectory();
  let mimeType;
  if (isDir) {
    mimeType = 'application/vnd.google-apps.folder';
  } else {
    mimeType = mimeTypesByExt[path.extname(localPath).slice(1)];
  }

  // metadata
  const fileMetadata = {
    name: fileName,
    mimeType,
    parents: [parentId],
  };

  let fileId;

  // handle directories
  if (isDir) {
    const parentIdChildren = await this.makeFolder({
      folderName: fileName,
      parentIdentifiers: parentId,
      overwrite,
    });
    fileId = parentIdChildren;
    const children = fs.readdirSync(localPath);
    for (const child of children) {
      const localPathChild = path.join(localPath, child);
      await this.upload({
        localPath: localPathChild,
        parentIdentifiers: parentIdChildren,
        overwrite,
      });
    }

  // handle files
  } else {
    if (overwrite) this._overwrite(fileMetadata);
    // error while uploading file doesn't stop execution
    try {
      fileId = await this._uploadFile(localPath, fileMetadata);
    } catch (e) {
      console.error(
          `Error while uploading file ${localPath}`);
      console.error(e);
    }
  }

  return fileId;
}

/**
 * Uploads a file.
 * @param {string} localPath - Path to file or folder on disk
 * @param {Object} fileMetadata - An object with the properties
 * <code>name</code>, <code>mimeType</code>, and <code>parents</code>.
 * <code>parents</code> is a list with a single string corresponding
 * to the parent id
 * @return {undefined} None
 * @access private
 */
async function _uploadFile(localPath, fileMetadata) {
  const media = {
    mimeType: fileMetadata.mimeType,
    body: fs.createReadStream(localPath),
  };
  const responseData = await this.api('files', 'create', {
    resource: fileMetadata,
    media: media,
    fields: 'id',
  });
  return responseData.id;
}
