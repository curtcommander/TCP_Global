'use strict';

module.exports = {
  del,
};

/**
 * Deletes a file or folder in Google drive.
 * @param {Object|string} identifiers - An object
 * used to identify a file or folder. Must have either
 * <code>fileId</code> or <code>fileName</code>.
 * Also accepts a string containing the file/folder
 * id or path (can be partial) to the file/folder in Google Drive
 * @param {string} identifiers.fileId - File/folder id
 * @param {string} identifiers.fileName - File/folder name
 * @param {string} [identifiers.parentId] - Parent id
 * @param {string} [identifiers.parentName] - Parent name
 * @return {Promise<undefined>} None
 * @example
 * // delete file "fileName" whose parent is "folderName"
 * utilsGDrive.del({
 *   fileName: "fileName",
 *   parentName: "folderName"
 * });
 *
 * // delete file whose id is "fileId"
 * utilsGDrive.del("fileId");
 */
async function del(identifiers) {
  const fileId = await this._resolveId(identifiers);
  const responseData = await this.api('files', 'delete', {fileId});
  return responseData.files;
}

