'use strict';

const path = require('path');

module.exports = {
  api,
  listFiles,
  getFiles,
  updateFiles,
  getFileName,
  getFileId,
  _resolveIdFromString,
  _resolveId,
  _handleListFilesResponse,
  getMime,
  listChildren,
};

/**
 * Base function for making requests to the Google Drive API.
 * @see Consult
 * [Google Drive API reference]{@link https://developers.google.com/drive/api/v3/reference}
 * for information on the resources and methods available
 * as well as the API methods' parameters.
 * @param {string} resource - Name of API resource
 * @param {string} method - One of the API resource's methods
 * @param {Object} params - Method parameters
 * @return {Object} Data from response
 * @example
 * // Use the files resource and list method to
 * // get ids of files with the name "fileName"
 * utilsGDrive.api("files", "list", {
 *   q: "name = 'fileName'",
 *   fields: "files(id)"
 * });
 */
function api(resource, method, params) {
  return new Promise((resolve, reject) => {
    this.throttle(() => {
      this.drive[resource][method](params, (err, response) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(response.data);
      });
    });
  });
}

/**
 * Makes a request to the API's files resource using
 * its list method, which is primarily used to search for files/folders
 * using the <code>q</code> method parameter.
 * @see Wraps {@link api}
 * @param {Object} params - Method parameters,
 * two of which are highlighted below.
 * @param {string} [params.q] - Query string used to search for files/folders
 * @param {string} [params.fields] - Data fields to request.
 * Should follow the pattern <code>"files(fiel1, field2,...)"</code>.
 * Default value is <code>"files(name, id, mimeType)"</code>
 * @param {boolean} [ignoreTrash=true] - Whether to include trash
 * as a search location
 * @return {Object} Data from response
 * @example
 * // search for files with the name "fileName" and get their ids
 * utilsGDrive.listFiles({
 *   q: "name = 'fileName'",
 *   fields: "files(id)"
 * });
 */
function listFiles(params, ignoreTrash=true) {
  if (!params.fields) params.fields = 'files(name, id, mimeType)';
  if (params.q) {
    const regEx = new RegExp('(and)? trashed ?= ?(true|false)');
    const matches = regEx.exec(params.q);
    if (matches) params.q = params.q.replace(matches[0], '');
    params.q += ' and trashed=' + !ignoreTrash;
  }
  return this.api('files', 'list', params)
      .catch((err) => console.error(err));
}

/**
 * Makes a request to the files resource using its get method,
 * which can be used to get information on files and/or download them.
 * @see Wraps {@link api}
 * @param {Object} params - Method parameters.
 * <code>fileId</code> is a required property.
 * @param {string} params.fileId - File/folder id
 * @return {Object} Data from response
 * @throws Throws an error when file/folder id isn't specified.
 * More specifically, when <code>params.fileId</code> is falsy
 * @example
 * // get MIME type of the file whose id is "fileId"
 * utilsGDrive.getFiles({
 *   fileId: "fileId",
 *   fields: "mimeType"
 * });
 */
function getFiles(params) {
  if (!params.fileId) {
    const err = new this.Error('File id not specified.');
    // wrapping in Promise.resolve ensures chainability
    return Promise.resolve(console.error(err));
  }
  if (!params.fields) params.fields = 'name, id, mimeType';
  return this.api('files', 'get', params)
      .catch((err) => console.error(err));
}

/**
 * Makes a request to the API's files resource using
 * its update method, which can be used
 * to change a file or folders's name or to move a file to a different location
 * within Google Drive.
 * @see Wraps {@link api}
 * @param {Object} params - Method parameters
 * <code>fileId</code> is a required property.
 * @param {string} params.fileId - File/folder id
 * @return {Object} Data from response
 * @throws Throws an error when file/folder id isn't specified.
 * More specifically, when <code>params.fileId</code> is falsy
 * @example
 * // change the name of a file whose id is "fileId" to "newFileName"
 * utilsGDrive.updateFiles({
 *   fileId: "fileId"
 *   resource: {name: "newFileName"}
 * });
 */
function updateFiles(params) {
  if (!params.fileId) {
    const err = new this.Error('File id not specified.');
    // wrapping in Promise.resolve ensures chainability
    return Promise.resolve(console.error(err));
  }
  return this.api('files', 'update', params)
      .catch((err) => console.error(err));
}

/**
 * Gets file/folder name given id.
 * @param {string} fileId - File/folder id
 * @return {string} File/folder name
 * @example
 * // get name of file whose id is "fileId"
 * utilsGDrive.getFileName("fileId");
 */
async function getFileName(fileId) {
  const responseData = await this.getFiles({fileId, fields: 'name'});
  if (responseData) return responseData.name;
}

/**
 * Verifies that exactly one file was found
 * in Google Drive matching the identifiers.
 * @see Called by <code>getFileId</code>
 * @param {Object} responseData - Response data from
 * <code>listFiles</code>
 * @param {string} fileName - <code>fileName</code>
 * from <code>getFileId</code>
 * @return {undefined|UtilsGDriveError} <code>undefined</code>
 * if only 1 file found. <code>UtilsGDriveError</code>
 * if 0 or more than 1 file found
 * @access private
 */
function _handleListFilesResponse(responseData, fileName) {
  const nFiles = responseData.length;
  let e;
  if (nFiles === 0) {
    e = new this.Error('No files found matching identifiers specified.');
  } else if (nFiles > 1) {
    e = new this.Error(
        `Multiple files found: ${fileName}. Consider specifying parent.`);
  }
  return e;
}

/**
 * Resolves file id from string.
 * @param {string} str - Can be either file id
 * or path
 * @return {string} File/folder id
 * @access private
 */
async function _resolveIdFromString(str) {
  const names = str.split(path.sep);
  if (names.length === 1) {
    return names[0];
  }
  let currentId = await this.getFileId({
    fileName: names[0],
  });
  for (const name of names.slice(1)) {
    currentId = await this.getFileId({
      fileName: name,
      parentId: currentId,
    });
  }
  return currentId;
}

/**
 * Gets file/folder id given name.
 * @param {Object|string} identifiers - An object
 * used to identify a file or folder. Must have
 * <code>fileName</code>. Also accepts
 * a string containing the file/folder name or path
 * (can be partial) to the file/folder in Google Drive.
 * @param {string} identifiers.fileName - File/folder name
 * @param {string} [identifiers.parentId] - Parent id
 * @param {string} [identifiers.parentName] - Parent name
 * @return {string} File/folder id
 * @throws Throws an error if exactly one file/folder isn't found
 * given identifiers specified
 * @example
 * // get id of file whose name is "fileName"
 * // and whose parent is named "folderName"
 * utilsGDrive.getFileId({
 *   fileName: "fileName",
 *   parentName: "folderName"
 * })
 *
 * // code above is equivalent to the following
 * utilsGDrve.getFileId("folderName/fileName");
 *
 * // get id of file whose name is "fileName"
 * // assuming no other files/folders in Google Drive
 * // are also named "fileName"
 * utilsGDrive.getFileId("fileName");
 *
 */
async function getFileId({fileName, parentId, parentName}) {
  // handle string
  if (typeof(arguments[0]) === 'string') {
    if (arguments[0].indexOf(path.sep) + 1) {
      return this._resolveIdFromString(arguments[0]);
    } else {
      fileName = arguments[0];
    }
  }

  // build q
  let q = 'name="' + fileName + '"';
  if (parentId || parentName) {
    let p;
    if (parentId) {
      p = parentId;
    } else if (parentName) {
      const responseData = await this.listFiles({
        q: 'name="' + parentName + '"',
        fields: 'files(id)',
      });
      if (responseData) {
        const files = responseData.files;
        const e = this._handleListFilesResponse(files, fileName);
        if (e) return console.error(e);
        p = files[0].id;
      }
    }
    q += ' and "' + p + '" in parents';
  }

  const responseData = await this.listFiles({q, fields: 'files(id)'});
  if (responseData) {
    const files = responseData.files;
    const e = this._handleListFilesResponse(files, fileName);
    if (e) return console.error(e);
    return files[0].id;
  }
}

/**
 * Resolves file/folder id given object with data
 * identifying the file/folder.
 * @param {Object|string} identifiers - An object
 * used to identify a file or folder. Must have either
 * <code>fileId</code> or <code>fileName</code>.
 * Also accepts a string containing the file/folder
 * id or path (can be partial) to the file/folder in Google Drive.
 * @param {string} identifiers.fileId - File/folder id
 * @param {string} identifiers.fileName - File/folder name
 * @param {string} [identifiers.parentId] - Parent id
 * @param {string} [identifiers.parentName] - Parent name
 * @throws Throws an error if invalid property name given.
 * Valid property names are the ones above.
 * @return {string} File/folder id
 * @access private
 */
async function _resolveId(identifiers) {
  // handle string
  if (typeof(identifiers) === 'string') {
    return this._resolveIdFromString(identifiers);
  }

  // pass fileId through if already specified
  if (identifiers.fileId) return identifiers.fileId;

  // default to root if empty object
  if (!Object.keys(identifiers).length) return 'root';

  // validate identifiers
  const validIdentifiers = ['fileId', 'fileName', 'parentId', 'parentName'];
  for (const identifier in identifiers) {
    if (validIdentifiers.indexOf(identifier) == -1) {
      throw new this.Error('Invalid property name: ' + identifier);
    }
  }
  return this.getFileId(identifiers);
}

/**
 * Gets a file or folder's MIME type.
 * @param {Object|string} identifiers - An object
 * used to identify a file or folder. Must have either
 * <code>fileId</code> or <code>fileName</code>.
 * Also accepts a string containing the file/folder
 * id or path (can be partial) to the file/folder in Google Drive.
 * @param {string} identifiers.fileId - File/folder id
 * @param {string} identifiers.fileName - File/folder name
 * @param {string} [identifiers.parentId] - Parent id
 * @param {string} [identifiers.parentName] - Parent name
 * @return {string} MIME type
 * @example
 * // get MIME type of file whose id is "fileId"
 * utilsGDrive.getMime("fileId")
 *
 * // get MIME type of file using path
 * utilsGDrive.getMime("parentName1/parentName2/fileName");
 *
 * // get MIME type of file whose fileName is "fileName"
 * // and that resides in folder whose id is "folderId"
 * utilsGDrive.getMime({
 *   fileName: "fileName",
 *   parentId: "folderId"
 * });
 */
async function getMime(identifiers) {
  let fileId;
  try {
    fileId = await this._resolveId(identifiers);
  } catch (err) {
    return console.error(err);
  }
  const responseData = await this.getFiles({
    fileId,
    fields: 'mimeType',
  });
  if (responseData) return responseData.mimeType;
}

/**
 * Gets data on files in a folder.
 * @param {Object|string} identifiers - An object
 * used to identify a file or folder. Must have either
 * <code>fileId</code> or <code>fileName</code>.
 * Also accepts a string containing the file/folder
 * id or path (can be partial) to the file/folder in Google Drive.
 * @param {string} identifiers.fileId - File/folder id
 * @param {string} identifiers.fileName - File/folder name
 * @param {string} [identifiers.parentId] - Parent id
 * @param {string} [identifiers.parentName] - Parent name
 * @param {string} [fields] - Data fields to request.
 * Should follow the pattern <code>"files(field1, field2,...)"</code>.
 * Default value is <code>"files(name, id, mimeType)"</code>
 * @return {Array} Each entry in the array returned
 * is an object containing data on a file
 * that resides in the folder specified
 * @example
 * // get names of files in the folder whose id is "folderId"
 * utilsGDrive.listChildren("folderId", "files(name)");
 *
 * // get ids of files in "folderName" using path
 * utilsGDrive.listChildren("parentName1/parentName2/folderName", "files(id)");
 */
async function listChildren(identifiers, fields = 'files(name, id, mimeType)') {
  let folderId;
  try {
    folderId = await this._resolveId(identifiers);
  } catch (err) {
    return console.error(err);
  }

  const listFilesParams = {
    q: '"' + folderId + '" in parents',
    fields: fields,
  };
  const responseData = await this.listFiles(listFilesParams);
  if (responseData) return responseData.files;
}
