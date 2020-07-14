'use strict';

const drive = require('./drive');
const config = require('../config');

api = drive._addDrive(api);

module.exports = {
  api,
  listFiles,
  getFiles,
  getFileId,
  getFileName,
  listChildren,
  listChildrenFileId,
  listChildrenFileName,
  _collapseParamsToId,
};

/**
 * Base function for making requests to the Google Drive api.
 * @param {String} resource - An api resource
 * @param {String} method - One of the api resource's methods
 * @param {Object} params - Method parameters
 * @return {Object} - Data from response
 * @this utilsGDrive
 */
function api(resource, method, params) {
  if (config.LOG) {
    console.log('Resource:  ', resource);
    console.log('Method:    ', method);
    console.log('Parameters:\n', params);
  }
  return new Promise((resolve, reject) => {
    this.drive[resource][method](params, (error, response) => {
      if (error) reject(new Error('Error from Google Drive api:', error));
      if (response.status != 200) {
        reject(new Error('Response status code wasn\'t 200:', response));
      };
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
 * Makes a request to files resource using list method. Wraps `api`.
 * @param {Object} params - Method parameters
 * @return {Object} - Data from response
 * @example listFiles({q: "name = 'Reports'", fields: 'files(id)'});
 */
function listFiles(params) {
  if (!params.fields) params.fields = 'files(name, id, mimeType)';
  return api('files', 'list', params);
}

/**
 * Makes a request to files resource using get method. Wraps `api`.
 * @param {Object} params - Method parameters
 * @return {Object} - Data from response
 * @example getFiles({fileId: '10000SADFS-28D38DK_09D', fields: 'name'})
 */
function getFiles(params) {
  if (!params.fields) params.fields = 'name, id, mimeType';
  return api('files', 'get', params);
}

/**
 * Resolves id property in params.
 * @param {Object} params - An object with a property whose name
 * ends in either 'Name' or 'Id'
 * @return {void} - None
 * @example
 * // resolve file id for a file's parent
 * _collapseParamsToId({parentName: 'Reports'});
 * @access private
 */
async function _collapseParamsToId(params) {
  const propPrefix = Object.keys(params)[0]
      .replace('Id', '').replace('Name', '');
  // id given
  if (params[propPrefix+'Id']) {
    return;
  // name given
  } else if (params[propPrefix+'Name']) {
    const data = await getFileId(params[propPrefix+'Name']);
    params[propPrefix+'Id'] = data;
    return;
  // default to root if neither id nor name given
  } else {
    params[propPrefix+'Id'] = 'root';
    return;
  }
}

/**
 * Gets file id given file name.
 * @param {String} fileName - File name
 * @param {Object} [parentParams] - An object with either `parentId`
 * or `parentName`
 * @return {String} - File id
 * @throws Throws an error if multiple files are found given
 * parameters specified
 */
async function getFileId(fileName, parentParams = {}) {
  let q = 'name="'+fileName+'" and trashed=false';
  if (parentParams.length) {
    await _collapseParamsToId(parentParams);
    q += ' and "'+parentParams.parentId+'" in parents';
  }
  const data = await listFiles({q: q, fields: 'files(id)'});
  if (data.files.length > 1) {
    throw new Error('Multiple files found.');
  }
  return data.files[0].id;
}

/**
 * Gets file name given file id.
 * @param {String} fileId - File id
 * @return {String} - File name
 */
async function getFileName(fileId) {
  const data = await getFiles({fileId: fileId, fields: 'name'});
  return data.name;
}

/**
 * Lists children given file id or file name. Wraps `listFiles`.
 * @param {Object} params - An object with either `fileId` or `fileName`
 * and optionally `fields`}
 * @return {Object} - Data from response
 * @example listChildren({fileName: 'Reports'})
 */
async function listChildren(params) {
  await _collapseParamsToId(params);
  const paramsListChildren = {q: '\''+params.fileId+
      '\' in parents and trashed=false'};
  if (params.fields) paramsListChildren[fields] = params.fields;
  return listFiles(paramsListChildren);
}

/**
 * Lists children given file id. Wraps `listChildren`.
 * @param {*} fileId - File id
 * @return {Object} - Data from response
 */
function listChildrenFileId(fileId) {
  return listChildren({fileId});
}

/**
 * Lists children given file name. Wraps `listChildren`.
 * @param {String} fileName - File name
 * @return {Object} - Data from response
 */
function listChildrenFileName(fileName) {
  return listChildren({fileName});
}
