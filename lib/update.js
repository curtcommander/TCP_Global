'use strict';

module.exports = {
  rename,
  mv,
};

/**
 * Renames a file or folder in Google Drive.
 * @param {Object|String} identifiers - An object identifying the file/folder
 * with either <code>fileId</code>/<code>folderId</code>
 * or <code>fileName</code>/<code>folderName</code>
 * <code>parentId</code> and <code>parentName</code> properties may
 * also be included.
 * This parameter can also be a string containing the file/folder id.
 * @param {String} newName - New file/folder name
 * @return {undefined} None
 * @example
 * // rename file "fileName" to "newFileName"
 * utilsGDrive.rename({fileName: "fileName"}, "newFileName")
 */
async function rename(identifiers, newName) {
  let fileId;
  try {
    fileId = await this._resolveFId(identifiers);
  } catch (err) {
    return console.error(err);
  }
  const params = {fileId, resource: {name: newName}};
  return this.updateFiles(params);
}

/**
 * Moves a file or folder in Google Drive.
 * @param {Object|String} identifiers - An object identifying the file/folder
 * with either <code>fileId</code>/<code>folderId</code>
 * or <code>fileName</code>/<code>folderName</code>
 * <code>parentId</code> and <code>parentName</code> properties may
 * also be included.
 * This parameter can also be a string containing the file/folder id.
 * @param {Object|String} [newParentParams] - An object identifying
 * the new parent with either <code>parentId</code> or <code>parentName</code>.
 * Can also be a string containing the parent id.
 * File will be moved to root folder if this parameter isn't specified.
 * @return {undefined} None
 * @example
 * // move the file "fileName" to the folder "folderName"
 * utilsGDrive.mv({fileName: "fileName"}, {newParentName: "folderName"})
 */
async function mv(identifiers, newParentParams = {}) {
  let fileId;
  let oldParentId;
  let newParentId;
  try {
    fileId = await this._resolveFId(identifiers);
    const responseData = await this.getFiles({fileId, fields: 'parents'});
    oldParentId = responseData.parents[0];
    newParentId = await this._resolveParamsId(newParentParams);
  } catch (err) {
    return console.error(err);
  }
  const params = {
    fileId,
    removeParents: oldParentId,
    addParents: newParentId,
  };
  return this.updateFiles(params);
}
