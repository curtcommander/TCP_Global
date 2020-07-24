'use strict';

module.exports = {
  api,
  listFiles,
  getFiles,
  updateFiles,
  getFileId,
  getFileName,
  getMime,
  listChildren,
  _resolveParamsId,
  _resolveFId,
};

/**
 * Base function for making requests to the Google Drive API.
 * @see Consult
 * [Google Drive API reference]{@link https://developers.google.com/drive/api/v3/reference}
 * for information on the resources and methods available
 * and on the parameters that API methods accept.
 * @param {String} resource - Name of API resource
 * @param {String} method - One of the API resource's methods
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
    this.drive[resource][method](params, (err, response) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(response.data);
    });
  });
}

/**
 * Makes a request to the API's files resource using
 * its list method, which is primarily used to search for files/folders
 * using the <code>q</code> method parameter.
 * @see Wraps {@link api}
 * @param {Object} params - Method parameters.
 * Default for the <code>fields</code> method
 * parameter is <code>"files(name, id, mimeType)"</code>
 * @param {Boolean} [ignoreTrash] - Whether to include trash
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
  return this.api('files', 'list', params).catch((err) => console.error(err));
}

/**
 * Makes a request to the files resource using its get method,
 * which can be used to get information on files and/or download them.
 * @see Wraps {@link api}
 * @param {Object} params - Method parameters. Files/folders are accessed by id
 * for this API method, so <code>fileId</code> is a required property.
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
  return this.api('files', 'get', params).catch((err) => console.error(err));
}

/**
 * Makes a request to the API's files resource using
 * its update method, which can be used
 * to change a file or folders's name or to move a file to a different location
 * within Google Drive.
 * @see Wraps {@link api}
 * @param {Object} params - Method parameters.
 * Files/folders are accessed by id for this API method, so
 * <code>fileId</code> is a required property.
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
  return this.api('files', 'update', params).catch((err) => console.error(err));
}

/**
 * Resolves id of file/folder using <code>params</code>.
 * @param {Object|String} params - An object with a property whose name
 * ends in either "Name" or "Id". Can also be a string containing the
 * the file/folder id
 * @return {String} File/folder id
 * @access private
 */
async function _resolveParamsId(params) {
  if (typeof params === 'string') return params;
  let propPrefix;
  for (const key in params) {
    if (key.indexOf('Name') + key.indexOf('Id') > -2) {
      propPrefix = key.replace('Id', '').replace('Name', '');
      break;
    }
  }
  // id given
  if (params[propPrefix + 'Id']) {
    return params[propPrefix + 'Id'];
    // name given
  } else if (params[propPrefix + 'Name']) {
    return this.getFileId(params[propPrefix + 'Name']);
    // default to root if neither id nor name given
  } else {
    return 'root';
  }
}

/**
 * Gets file/folder id given name.
 * @param {String} fileName - File/folder name
 * @param {Object|String} [paramsParent] - An object identifying
 * the parent with either <code>parentId</code> or <code>parentName</code>.
 * Can also be a string containing the parent id.
 * @return {String} File/folder id
 * @throws Throws an error if exactly one file/folder isn't found
 * given itendifiers specified
 * @example
 * // get id of file whose name is "fileName"
 * utilsGDrive.getFileId("fileName");
 */
async function getFileId(fileName, paramsParent = {}) {
  let q = 'name="' + fileName + '"';
  if (Object.keys(paramsParent).length) {
    const parentId = await this._resolveParamsId(paramsParent);
    q += ' and "' + parentId + '" in parents';
  }

  const responseData = await this.listFiles({q, fields: 'files(id)'});
  if (responseData) {
    let e;
    const nFiles = responseData.files.length;
    if (nFiles > 1) {
      e = new this.Error('Multiple files found. Consider specifying parent.');
    } else if (nFiles === 0) {
      e = new this.Error('No files found matching identifiers specified.');
    }
    if (e) return console.error(e);
    return responseData.files[0].id;
  }
}

/**
 * Gets file/folder name given id.
 * @param {String} fileId - File/folder id
 * @return {String} File/folder name
 * @example
 * // get name of file whose id is "fileId"
 * utilsGDrive.getFileId("fileId");
 */
async function getFileName(fileId) {
  const responseData = await this.getFiles({fileId, fields: 'name'});
  if (responseData) return responseData.name;
}

/**
 * Resolves file/folder id given object with data
 * identifying the file/folder.
 * @param {Object|String} identifiers - An object identifying
 * the file/folder with either <code>fileId</code>/<code>folderId</code>
 * or <code>fileName</code>/<code>folderName</code>.
 * <code>parentId</code> and <code>parentName</code>
 * properties may also be included.
 * Can also be a string containing the file/folder id.
 * @throws Throws an error if invalid property name given.
 * Valid property names are the ones above.
 * @return {String} File/folder id
 * @access private
 */
async function _resolveFId(identifiers) {
  if (typeof identifiers === 'string') return identifiers;
  if (identifiers.fileId) return identifiers.fileId;
  if (identifiers.folderId) return identifiers.folderId;

  const fIdentifiers = ['fileId', 'fileName', 'folderId', 'folderName'];
  const pIdentifiers = ['parentId', 'parentName'];
  const fParams = {};
  const pParams = {};
  for (const key in identifiers) {
    if (fIdentifiers.includes(key)) {
      fParams[key] = identifiers[key];
    } else if (pIdentifiers.includes(key)) {
      pParams[key] = identifiers[key];
    } else {
      throw new this.Error('Invalid property name: ' + key);
    }
  }

  let fName;
  fParams.fileName ? (fName = fParams.fileName) : (fName = fParams.folderName);
  let parentId;
  if (Object.keys(pParams).length) {
    parentId = await this._resolveParamsId(pParams);
  }
  if (!parentId) return this.getFileId(fName);
  return this.getFileId(fName, {parentId});
}

/**
 * Gets a file or folder's MIME type.
 * @param {Object|String} identifiers - An object identifying the file/folder
 * with either <code>fileId</code>/<code>folderId</code>
 * or <code>fileName</code>/<code>folderName</code>.
 * <code>parentId</code> and <code>parentName</code>
 * properties may also be included.
 * This parameter can also be a string containing the file/folder id.
 * @return {String} MIME type
 * @example
 * // get MIME type of file whose id is "fileId"
 * // and that resides in folder whose id is "folderId"
 * utilsGDrive.getMime({
 *   fileId: "fileId",
 *   parentId: "folderId"
 * });
 */
async function getMime(identifiers) {
  let fileId;
  try {
    fileId = await this._resolveFId(identifiers);
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
 * @param {Object|String} identifiers - An object identifying the folder
 * with either <code>folderId</code> or <code>folderName</code>.
 * <code>parentId</code> and <code>parentName</code> properties may
 * also be included.
 * This parameter can also be a string containing the folder id.
 * @param {String} [fields] - The data fields to request. Format should
 * follow the pattern <code>'files(field1, field2,...)'</code>
 * @return {Array} Each entry in the array returned
 * is an object containing data on a file
 * that resides in the folder specified
 * @example
 * // get names of files in the folder whose name is "folderName"
 * utilsGDrive.listChildren({folderName: "folderName"}, "files(name)");
 */
async function listChildren(identifiers, fields = 'files(name, id, mimeType)') {
  let folderId;
  try {
    folderId = await this._resolveFId(identifiers);
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
