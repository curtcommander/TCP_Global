'use strict';

const drive = require('./drive');
const config = require('../config');
const utilsGoogleDrive = require('..');

api = drive._addDrive(api);

module.exports = {
  api,
  listFiles,
  getFiles,
  getFileId,
  getFileIdPId,
  getFileIdPName,
  getFileName,
  getMime,
  getMimeFId,
  getMimeFNamePId,
  getMimeFNamePName,
  listChildren,
  listChildrenFId,
  listChildrenFNamePId,
  listChildrenFNamePName,
  _collapseParamsToId,
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
 * @return {Object} Data from response
 * @example
 * // search for files with the name "File Name" and get their ids
 * utilsGDrive.listFiles({
 *  q: "name = 'File Name'",
 *  fields: "files(id)"
 * });
 */
function listFiles(params) {
  if (!params.fields) params.fields = 'files(name, id, mimeType)';
  return api('files', 'list', params);
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
  if (!params.fileId) throw new Error('File id not specified.')
  if (!params.fields) params.fields = 'name, id, mimeType';
  return api('files', 'get', params);
}

/**
 * Resolves id property in <code>params</code>. Defaults to 'root'
 * if <code>params</code> doesn't have any property ending in
 * either "Name" or "Id".
 * @param {Object} params - An object with a property whose name
 * ends in either "Name" or "Id"
 * @return {void} None
 * @example
 * // resolve file id for a file's parent
 * _collapseParamsToId({
 *  parentName: "Parent Name"
 * });
 * @access private
 */
async function _collapseParamsToId(params) {
  let propPrefix;
  for (const key in params) {
    if (key.indexOf('Name') + key.indexOf('Id') > -2) {
      propPrefix = key.replace('Id', '').replace('Name', '');
    }
  }
  // id given
  if (params[propPrefix+'Id']) {
    return;
  // name given
  } else if (params[propPrefix+'Name']) {
    const responseData = await getFileId(params[propPrefix+'Name']);
    params[propPrefix+'Id'] = responseData;
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
 * @param {Object} [paramsParent] - An object identifying 
 * the parent with either <code>parentId</code>
 * or <code>parentName</code>
 * @return {String} File id
 * @throws Throws an error if multiple files are found given
 * parameters specified.
 * @example
 * // get id of file whose name is "File Name"
 * utilsGDrive.getFileId("File Name");
 */
async function getFileId(fileName, paramsParent = {}) {
  let q = 'name="'+fileName+'" and trashed=false';
  if (Object.keys(paramsParent).length) {
    await _collapseParamsToId(paramsParent);
    q += ' and "'+paramsParent.parentId+'" in parents';
  }
  const responseData = await listFiles({q: q, fields: 'files(id)'});
  if (responseData.files.length > 1) {
    throw new Error('Multiple files found. Consider specifying parent.');
  }
  return responseData.files[0].id;
}

/**
 * Gets file id given file name and parent id.
 * @see Wraps {@link getFileId}
 * @param {String} fileName - File name
 * @param {String} parentId - Parent id
 * @return {String} File id
 * @example
 * // get id of file whose name is "File Name" and that resides
 * // in the folder whose id is "XXX_FOLDER_ID_XXX" 
 * utilsGDrive.getFileIdPId("File Name", "XXX_FOLDER_ID_XXX");
 */ 
function getFileIdPId(fileName, parentId) {
  return getFileId(fileName, {parentId});
}

/**
 * Gets file id given file name and parent name.
 * @see Wraps {@link getFileId}
 * @param {String} fileName - File name
 * @param {String} parentName - Parent name
 * @return {String} File id 
 * @example
 * // get id of file whose name is "File Name" and that resides
 * // in the folder whose name is "Folder Name" 
 * utilsGDrive.getFileIdPId("File Name", "Folder Name");
 */
function getFileIdPName(fileName, parentName) {
  return getFileId(fileName, {parentName});
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
  const responseData = await getFiles({fileId: fileId, fields: 'name'});
  return responseData.name;
}

/**
 * Gets a file's MIME type.
 * @param {Object} fileParams - An object identifying
 * the file with either <code>fileId</code> or <code>fileName</code>
 * @param {Object} [parentParams] - An object identifying
 * the parent with either <code>parentId</code> or <code>parentName</code>
 * @return {String} MIME type
 * @example
 * // get MIME type of file whose id is "XXX_FILE_ID_XXX"
 * // and that resides in folder whose id is "XXX_FOLDER_ID_XXX"
 * utilsGDrive.getMime({fileId: "XXX_FILE_ID_XXX"}, {parentId: "XXX_FOLDER_ID_XXX"});
 */
async function getMime(fileParams, parentParams = {}) {
  if (!fileParams.fileId && fileParams.fileName) {
    fileParams.fileId = await getFileId(fileParams.fileName, parentParams);
  }
  const responseData = await getFiles({
    fileId: fileParams.fileId, fields: 'mimeType',
  });
  return responseData.mimeType;
}

/**
 * Gets MIME type given file id.
 * @see Wraps {@link getMime}
 * @param {String} fileId - File id
 * @return {String} MIME type
 * @example
 * // get MIME type of file whose id is "XXX_FILE_ID_XXX"
 * utilsGDrive.getMimeFId("XXX_FILE_ID_XXX", "XXX_FOLDER_ID_XXX");
 */
function getMimeFId(fileId) {
  return getMime({fileId})
}

/**
 * Gets MIME type given file name and parent id.
 * @see Wraps {@link getMime}
 * @param {String} fileName - File name
 * @param {String} [parentId] - Parent id
 * @return {String} MIME type
 * @example
 * // get MIME type of file whose name is "File Name"
 * // and that resides in folder whose id is "XXX_FOLDER_ID_XXX"
 * utilsGDrive.getMimeFNamePId("File Name", "XXX_FOLDER_ID_XXX");
 */
function getMimeFNamePId(fileName, parentId) {
  return getMime({fileName}, {parentId})
}

/**
 * Gets MIME type given file name and parent name.
 * @see Wraps {@link getMime}
 * @param {String} fileName - File name
 * @param {String} [parentName] - Parent name
 * @return {String} MIME type
 * @example
 * // get MIME type of file whose name is "File Name"
 * // and that resides in folder whose name is "Folder Name"
 * utilsGDrive.getMimeFNamePName("File Name", "Folder Name");
 */
function getMimeFNamePName(fileName, parentName) {
  return getMime({fileName}, {parentName})
} 

/**
 * Gets data on files in a folder.
 * @param {Object} folderParams - An object identifying the folder with either
 * <code>folderId</code> or <code>folderName</code>
 * @param {Object} [parentParams] - An object identifying
 * the parent with either <code>parentId</code> or <code>parentName</code>
 * @param {String} [fields] - The data fields to request. Format should
 * follow the pattern <code>'files(field1, field2,...)'</code>
 * @return {Array} Each entry in the array returned is an object containing data on a file 
 * that resides in the folder specified
 * @example
 * // check if folder has any subfolders
 * utilsGDrive.listChildren({folderName: "Folder Name"}, null, 'files(mimeType)')
 * .then(data => {
 *  for (const d of data) {
 *    if (d.mimeType === "application/vnd.google-apps.folder") {
 *      console.log("Folder has subfolders")
 *      break;
 *    }
 *  }
 * });
 */
async function listChildren(
  folderParams, 
  parentParams = {},
  fields = 'files(name, id, mimeType)'
) {
  if (parentParams == null || typeof(parentParams) != 'object') parentParams = {};
  if (!folderParams.folderId && folderParams.folderName) {
    folderParams.folderId = await getFileId(folderParams.folderName, parentParams);
  }
  const listFilesParams = {
    q       : '\''+folderParams.folderId+'\' in parents and trashed=false',
    fields  : fields 
  };
  const responseData = await listFiles(listFilesParams);
  return responseData.files;
}

/**
 * Gets data on files in a folder given folder id.
 * @see Wraps {@link listChildren}
 * @param {String} folderId - Folder id
 * @param {String} [fields] - The data fields to request. Format should
 * follow the pattern <code>'files(field1, field2,...)'</code>
 * @return {Array} Each entry in the array returned is an object containing data on a file 
 * that resides in the folder specified
 * @example
 * // get the names of the files in the folder whose name is "Folder Name"
 * utisGDrive.listChildrenFId("Folder Name", "files(name)");
 */
function listChildrenFId(folderId, fields = 'files(name, id, mimeType)') {
  return listChildren({folderId}, null, fields);
}

/**
 * Gets data on files in a folder given folder name
 * and parent id.
 * @see Wraps {@link listChildren}
 * @param {String} folderName - Folder name
 * @param {String} [fields] - The data fields to request. Format should
 * follow the pattern <code>'files(field1, field2,...)'</code>
 * @param {String} [parentId] - Parent id
 * @return {Array} Each entry in the array returned is an object containing data on a file 
 * that resides in the folder specified
 * @example
 * // get ids of the files in the folder "Folder Name"
 * // whose parent folder's id is "XXX_FOLDER_ID_XXX"
 * utilsGDrive.listChildrenFNamePId("Folder Name", "XXX_FOLDER_ID_XXX", "files(id)")
 */
function listChildrenFNamePId(
  folderName, 
  parentId,  
  fields = 'files(name, id, mimeType)'
) {
  return listChildren({folderName}, {parentId}, fields);
}

/**
 * Gets data on files in a folder given folder name
 * and parent name.
 * @see Wraps {@link listChildren}
 * @param {String} folderName - Folder name
 * @param {String} [parentName] - Parent name
 * @param {String} [fields] - The data fields to request. Format should
 * follow the pattern <code>'files(field1, field2,...)'</code>
 * @return {Array} Each entry in the array returned is an object containing data on a file 
 * that resides in the folder specified
 * @example
 * // get names of the files in the folder "Folder Name" 
 * // whose parent folder's name is "Parent Folder Name"
 * utilsGDrive.listChildrenFNamePName("Folder Name", "Parent Folder Name", "files(name)")
 */
function listChildrenFNamePName(
  folderName, 
  parentName,  
  fields = 'files(name, id, mimeType)'
) {
  return listChildren({folderName}, {parentName}, fields);
}