'use strict';

module.exports = {
  rename,
  move,
};

/**
 * Renames a file or folder in Google Drive.
 * @param {Object|string} identifiers - An object
 * used to identify a file or folder. Must have either
 * <code>fileId</code> or <code>fileName</code>.
 * Also accepts a string containing the file/folder
 * id or path (can be partial) to the file/folder in Google Drive
 * @param {string} identifiers.fileId - File/folder id
 * @param {string} identifiers.fileName - File/folder name
 * @param {string} [identifiers.parentId] - Parent id
 * @param {string} [identifiers.parentName] - Parent name
 * @param {string} newName - New file/folder name
 * @return {undefined} None
 * @example
 * // rename file "fileName" to "newFileName"
 * utilsGDrive.rename({fileName: "fileName"}, "newFileName")
 */
async function rename(identifiers, newName) {
  const fileId = await this._resolveId(identifiers);
  const params = {fileId, resource: {name: newName}};
  return this.updateFiles(params);
}

/**
 * Moves a file or folder in Google Drive.
 * @param {Object|string} identifiers - An object
 * used to identify a file or folder. Must have either
 * <code>fileId</code> or <code>fileName</code>.
 * Also accepts a string containing the file/folder
 * id or path (can be partial) to the file/folder in Google Drive
 * @param {string} identifiers.fileId - File/folder id
 * @param {string} identifiers.fileName - File/folder name
 * @param {string} [identifiers.parentId] - Parent id
 * @param {string} [identifiers.parentName] - Parent name
 * @param {Object|string} [newParentIdentifiers] - The same as
 * <code>identifiers</code> but for the new parent.
 * File will be moved to root folder if this parameter isn't specified
 * @return {undefined} None
 * @example
 * // move the file "fileName" to the folder "folderName"
 * utilsGDrive.move({fileName: "fileName"}, {newParentName: "folderName"})
 *
 * // move the file with id "fileId" to the folder with id "folderId"
 * utilsGDrive.move("fileId", "folderId");
 *
 * // move a file using paths
 * utilsGDrive.move("path/to/file", "path/to/newParent");
 */
async function move(identifiers, newParentIdentifiers) {
  const fileId = await this._resolveId(identifiers);
  const responseData = await this.getFiles({fileId, fields: 'parents'});
  const oldParentId = responseData.parents[0];
  const newParentId = await this._resolveId(newParentIdentifiers);
  const params = {
    fileId,
    removeParents: oldParentId,
    addParents: newParentId,
  };
  return this.updateFiles(params);
}
