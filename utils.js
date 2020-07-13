'use strict';

const drive = require('./drive');
const config = require('./config');

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
};

/**
 * Base function for making requests to the Google Drive api.
 * @param {String} resource - An api resource
 * @param {String} method - One of the api resource's methods
 * @param {Object} params - Method parameters
 * @returns {Object} - Data from response
 */
function api(resource, method, params) {
  return new Promise((resolve, reject) => {
    if (config.LOG) {
      console.log('Resource:  ', resource);
      console.log('Method:    ', method);
      console.log('Parameters:\n', params);
    }
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
 * @retuns {Object} - Data from response
 * @example listFiles({q: "name = 'Reports'", fields: 'files(id)'});
 */
function listFiles(params) {
  if (!params.fields) params.fields = 'files(name, id, mimeType)';
  return api('files', 'list', params);
}

/**
 * Makes a request to files resource using get method. Wraps `api`.
 * @param {Object} params - Method parameters
 * @retuns {Object} - Data from response
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
 * @retuns {void} - None
 * @example
 * // resolve file id for a file's parent
 * _collapseParamsToId({parentName: 'Reports'});
 * @access private
 */
function _collapseParamsToId(params) {
  const propPrefix = Object.keys(params)[0]
      .replace('Id', '').replace('Name', '');
  // id given
  if (params[propPrefix+'Id']) {
    return new Promise((resolve) => {
      resolve();
    });
    // name given
  } else if (params[propPrefix+'Name']) {
    return getFileId(params[propPrefix+'Name'])
        .then((data) => {
          params[propPrefix+'Id'] = data;
          return;
        });
    // default to root if neither id nor name given
  } else {
    return new Promise((resolve) => {
      params[propId] = 'root';
      resolve();
    });
  }
}

/**
 * Gets file id given file name.
 * @param {String} fileName - File name
 * @param {Object} [parentParams] - An object with either `parentId`
 * or `parentName`
 * @retuns {String} - File id
 * @throws Throws an error if multiple files are found given
 * parameters specified
 */
async function getFileId(fileName, parentParams = {}) {
  let q = 'name="'+fileName+'" and trashed=false';
  if (parentParams.length) {
    await _collapseParamsToId(parentParams);
    q += ' and "'+parentParams.parentId+'" in parents';
  }
  return listFiles({q: q, fields: 'files(id)'})
      .then((data) => {
        if (data.files.length > 1) {
          throw new Error('Multiple files found.');
        }
        return data.files[0].id;
      });
}

/**
 * Gets file name given file id.
 * @param {String} fileId - File id
 * @retuns {String} - File name
 */
function getFileName(fileId) {
  return getFiles({fileId: fileId, fields: 'name'})
      .then((data) => {
        return data.name;
      });
}

/**
 * Lists children given file id or file name. Wraps `listFiles`.
 * @param {Object} params - An object with either `fileId` or `fileName`
 * and optionally `fields`}
 * @retuns {Object} - Data from response
 * @example listChildren({fileName: 'Reports'})
 */
function listChildren(params) {
  return _collapseParamsToId(params)
      .then(() => {
        const paramsListChildren = {q: '\''+params.fileId+
            '\' in parents and trashed=false'};
        if (params.fields) paramsListChildren[fields] = params.fields;
        return listFiles(paramsListChildren);
      });
}

/**
 * Lists children given file id. Wraps `listChildren`.
 * @param {*} fileId - File id
 * @retuns {Object} - Data from response
 */
function listChildrenFileId(fileId) {
  return listChildren({fileId});
}

/**
 * Lists children given file name. Wraps `listChildren`.
 * @param {*} fileName - File name
 * @retuns {Object} - Data from response
 */
function listChildrenFileName(fileName) {
  return listChildren({fileName});
}
