'use strict';

module.exports = {
  del,
};

/**
 * Deletes a file or folder in Google drive.
 * @param {Object|String} identifiers - An object identifying the file/folder
 * with either <code>fileId</code>/<code>folderId</code>
 * or <code>fileName</code>/<code>folderName</code>.
 * <code>parentId</code> and <code>parentName</code> properties may
 * also be included.
 * This parameter can also be a string containing the file/folder id.
 * @return {undefined} None
 * @example
 * // delete file "fileName" whose parent is "folderName"
 * utilsGDrive.del({
 *   fileName: "fileName",
 *   parentName: "folderName"
 * });
 */
async function del(identifiers) {
  let responseData;
  try {
    const fileId = await this._resolveFId(identifiers);
    responseData = await this.api('files', 'delete', {fileId});
  } catch (err) {
    console.error(err);
  }
  return responseData.files;
}
