'use strict';

const config = require('../config');

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
 * and on the parameters that methods accept.
 * @param {String} resource - An API resource
 * @param {String} method - One of the API resource's methods
 * @param {Object} params - Method parameters
 * @return {Object} Data from response object
 * @example
 * // Use the files resource and list method to get IDs of files with the name "File Name"
 * utilsGDrive.api("files", "list", {
 *  q: "name = 'File Name'",
 *  fields: "files(id)"
 * });
 */
function api(resource, method, params) {
  if (config.LOG) {
    console.log('Resource:  ', resource);
    console.log('Method:    ', method);
    console.log('Parameters:\n', params);
  }
  return new Promise((resolve, reject) => {
    this.drive[resource][method](params, (error, response) => {
      if (error) reject(error);
      if (config.LOG) {
        console.log('Response Data:');
        console.log(response.data);
        console.log();
      }
      resolve(response.data);
    });
  });
}

/**
 * Makes a request to API's files resource using 
 * list method. The list method
 * for the files resource is primarily used to search for files using the
 * method's <code>q</code> parameter. Default for the list method's
 * <code>fields</code> parameter is 
 * <code>"files(name, id, mimeType)"</code>.
 * @see Wraps {@link api}
 * @param {Object} params - Method parameters
 * @param {Boolean} ignoreTrash - Whether to include trash
 * as search location
 * @return {Object} Data from response
 * @example
 * // search for files with the name "File Name" and get their ids
 * utilsGDrive.listFiles({
 *  q: "name = 'File Name'",
 *  fields: "files(id)"
 * });
 */
function listFiles(params, ignoreTrash=true) {
  if (!params.fields) params.fields = 'files(name, id, mimeType)';
  if (params.q) {
    const regEx = new RegExp('(and)? trashed ?= ?(true|false)');
    const matches = regEx.exec(params.q);
    if (matches) params.q = params.q.replace(matches[0], '');
    params.q += ' and trashed='+!ignoreTrash;
  }
  return this.api('files', 'list', params);
}

/**
 * Makes a request to files resource using get method.
 * The get method for the files resource can be used to get information 
 * on files and/or download them. Files are accessed by id. As such,
 * <code>fileId</code> is a required property of <code>params</code>.
 * @see Wraps {@link api}
 * @param {Object} params - Method parameters. Should include <code>fileId</code>
 * @return {Object} Data from response
 * @throws Throws an error when file id isn't specified. More specifically,
 * when <code>params.fileId</code> is falsy.
 * @example
 * // get a file's MIME type
 * utilsGDrive.getFiles({
 *  fileId: "XXX_FILE_ID_XXX",
 *  fields: "mimeType"
 * });
 */
function getFiles(params) {
  if (!params.fileId) throw new Error('File id not specified.');
  if (!params.fields) params.fields = 'name, id, mimeType';
  return this.api('files', 'get', params);
}

/**
 * Makes a request to API's files resource using 
 * update method. The update method
 * can be used to change a file's name or to move a file to a different location
 * within Google Drive. Files are accessed by id. As such,
 * <code>fileId</code> is a required property of <code>params</code>.
 * @see Wraps {@link api}
 * @param {Object} params - Method parameters
 * @return {Object} Data from response
 * @example
 * // change the name of a file whose id is "XXX_FILE_ID_XXX"
 * // to "New File Name"
 * utilsGDrive.updateFiles({
 *  fileId: "XXX_FILE_ID_XXX"
 *  resource: {name: "New File Name"}
 * });
 */
function updateFiles(params) {
  return this.api('files', 'update', params);
}

/**
 * Resolves id of file/folder using <code>params</code>.
 * @param {Object} params - An object with a property whose name
 * ends in either "Name" or "Id"
 * @return {String} File/folder id
 * @example
 * // resolve file id for a file's parent
 * _resolveParamsId({
 *  parentName: "Parent Name"
 * });
 * @access private
 */
async function _resolveParamsId(params) {
  let propPrefix;
  for (const key in params) {
    if (key.indexOf('Name') + key.indexOf('Id') > -2) {
      propPrefix = key.replace('Id', '').replace('Name', '');
      break;
    }
  }
  // id given
  if (params[propPrefix+'Id']) {
    return params[propPrefix+'Id'];
  // name given
  } else if (params[propPrefix+'Name']) {
    return await getFileId.call(this, params[propPrefix+'Name']);
  // default to root if neither id nor name given
  } else {
    return 'root';
  }
}

/**
 * Gets file id given file name.
 * @param {String} fileName - File name
 * @param {Object} [paramsParent] - An object identifying
 * the parent with either <code>parentId</code>
 * or <code>parentName</code>
 * @return {String} File id
 * @throws Throws an error if exactly one file isn't found
 * given itendifiers specified.
 * @example
 * // get id of file whose name is "File Name"
 * utilsGDrive.getFileId("File Name");
 */
async function getFileId(fileName, paramsParent = {}) {
  let q = 'name="'+fileName+'"';
  if (Object.keys(paramsParent).length) {
    const parentId = await this._resolveParamsId(paramsParent);
    q += ' and "'+parentId+'" in parents';
  }
  const responseData = await this.listFiles({q, fields: 'files(id)'});
  const nFiles = responseData.files.length;
  if (nFiles > 1) {
    throw new Error('Multiple files found. Consider specifying parent.');
  } else if (nFiles === 0) {
    throw new Error('No files found matching identifiers specified.');
  }
  return responseData.files[0].id;
}

/**
 * Gets file name given file id.
 * @param {String} fileId - File id
 * @return {String} File name
 * @example
 * // get name of file whose id is "XXX_FILE_ID_XXX"
 * utilsGDrive.getFileId("XXX_FILE_ID_XXX");
 */
async function getFileName(fileId) {
  const responseData = await this.getFiles({fileId, fields: 'name'});
  return responseData.name;
}

/**
 * Resolves file id given object with data
 * identifying the file.
 * @param {Object} identifiers - An object identifying the file/folder
 * with either <code>fileId</code>/<code>folderId</code>
 * or <code>fileName</code>/<code>folderName</code>
 * <code>parentId</code> and <code>parentName</code> properties may
 * also be included
 * @return {String} File id
 * @access private
 */
async function _resolveFId(identifiers) {
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
      throw new Error('Invalid property name: '+key);
    }
  }
  let fName;
  (fParams.fileName) ? fName = fParams.fileName : fName = fParams.folderName;
  let parentId;
  if (Object.keys(pParams).length) parentId = await this._resolveParamsId(pParams);
  if (!parentId) return await this.getFileId(fName);
  return await this.getFileId(fName, {parentId});
}

/**
 * Gets a file's MIME type.
 * @param {Object} identifiers - An object identifying the file/folder
 * with either <code>fileId</code>/<code>folderId</code>
 * or <code>fileName</code>/<code>folderName</code>.
 * <code>parentId</code> and <code>parentName</code> properties may
 * also be included
 * @param {Object} [parentParams] - An object identifying
 * the parent with either <code>parentId</code> or <code>parentName</code>
 * @return {String} MIME type
 * @example
 * // get MIME type of file whose id is "XXX_FILE_ID_XXX"
 * // and that resides in folder whose id is "XXX_FOLDER_ID_XXX"
 * utilsGDrive.getMime({fileId: "XXX_FILE_ID_XXX", parentId: "XXX_FOLDER_ID_XXX"});
 */
async function getMime(identifiers) {
  const fileId = await this._resolveFId(identifiers);
  const responseData = await this.getFiles({
    fileId,
    fields: 'mimeType',
  });
  return responseData.mimeType;
}

/**
 * Gets data on files in a folder.
 * @param {Object} identifiers - An object identifying the folder
 * with either <code>folderId</code> or <code>folderName</code>.
 * <code>parentId</code> and <code>parentName</code> properties may
 * also be included
 * @param {String} [fields] - The data fields to request. Format should
 * follow the pattern <code>'files(field1, field2,...)'</code>
 * @return {Array} Each entry in the array returned is an object containing data on a file 
 * that resides in the folder specified
 * @example
 * // check if folder has any subfolders
 * utilsGDrive.listChildren({folderName: "Folder Name"}, 'files(mimeType)')
 * .then(data => {
 *  for (const d of data) {
 *    if (d.mimeType === "application/vnd.google-apps.folder") {
 *      console.log("Folder has subfolders");
 *      break;
 *    }
 *  }
 * });
 */
async function listChildren(identifiers, fields = 'files(name, id, mimeType)') {
  const folderId = await this._resolveFId(identifiers);
  const listFilesParams = {
    q: '\''+folderId+'\' in parents',
    fields: fields,
  };
  const responseData = await this.listFiles(listFilesParams);
  return responseData.files;
}
