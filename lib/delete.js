'use strict';

const drive = require('./drive');
const utils = require('./utils');

deleteFile = drive._addDrive(deleteFile);

module.exports = {
  deleteFile,
  deleteFileFId,
  deleteFileFNamePId,
  deleteFileFNamePName,
};

/**
 * Deletes a file in Google drive.
 * @param {Object} fileParams - An object identifying the file
 * to be deleted with either <code>fileId</code> or <code>fileName</code>
 * @param {Object} [parentParams] - An object identifying the parent
 * of the file to be deleted with either 
 * <code>parentId</code> or <code>parentName</code>
 * @return {void} None
 * @example
 * // delete file "File Name" whose parent is "Folder Name"
 * utilsGDrive.deleteFile({fileName: "File Name"}, {parentName: "Folder Name"});
 */
async function deleteFile(fileParams, parentParams = {}) {
  if (!fileParams.folderId && fileParams.folderName) {
    fileParams.fileId = await utils.getFileId(fileParams.fileName, parentParams);
  }
  await this.drive.files.delete({fileId: fileParams.fileId}, (error) => {
    if (error) return console.error(error);
    console.log(fileParams.fileId, 'has been deleted');
  });
}

/**
 * Deletes a file in given file id.
 * @see Wraps {@link deleteFile}
 * @param {String} fileId - Id of file to be deleted
 * @return {void} None
 * @example
 * // delete file whose id is "XXX_FILE_ID_XXX"
 * utilsGDrive.deleteFileFId("XXX_FILE_ID_XXX");
 */
function deleteFileFId(fileId) {
  return deleteFile({fileId});
}

/**
 * Deletes a file given file name and parent id.
 * @see Wraps {@link deleteFile}
 * @param {String} fileName - File name
 * @param {String} [parentId] - Parent id
 * @return {void} None
 * @example
 * // delete file "File Name" in the folder with id "XXX_FOLDER_ID_XXX"
 * utilsGDrive.deleteFileFNamePId("File Name", "XXX_FOLDER_ID_XXX");
 */
function deleteFileFNamePId(fileName, parentId) {
  return deleteFile({fileName}, {parentId});
}

/**
 * Deletes a file given file name and parent name.
 * @see Wraps {@link deleteFile}
 * @param {String} fileName - File name
 * @param {String} [parentName] - Parent name
 * @return {void} None
 * @example
 * // delete file "File Name" in the folder "Folder Name"
 * utilsGDrive.deleteFileFNamePName("File Name", "Folder Name");
 */
function deleteFileFNamePName(fileName, parentName) {
  return deleteFile({fileName}, {parentName});
}
