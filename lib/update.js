'use strict';

module.exports = {
  rename,
  mv,
};

/**
 * Renames a file or folder in Google Drive.
 * @param {Object} identifiers - An object identifying the file/folder
 * with either <code>fileId</code>/<code>folderId</code>
 * or <code>fileName</code>/<code>folderName</code>
 * <code>parentId</code> and <code>parentName</code> properties may
 * also be included
 * @param {String} newName - New file/folder name
 * @return {undefined} None
 * @example
 * // rename file "File Name" to "New File Name"
 * utilsGDrive.renmae({fileName: "File Name"}, "New File Name")
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
 * @param {Object} identifiers - An object identifying the file/folder
 * with either <code>fileId</code>/<code>folderId</code>
 * or <code>fileName</code>/<code>folderName</code>
 * <code>parentId</code> and <code>parentName</code> properties may
 * also be included
 * @param {Object} [newParentParams] - An object identifying
 * the new parent with either <code>parentId</code> or <code>parentName</code>
 * @return {undefined} None
 * @example
 * // move the file "File Name" to the folder "Folder Name"
 * utilsGDrive.mv({fileName: "File Name"}, {newParentName: "Folder Name"})
 */
async function mv(identifiers, newParentParams) {
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
