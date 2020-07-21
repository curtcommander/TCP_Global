'use strict';

const drive = require('./drive');
const utils = require('./utils');

del = drive._addDrive(del);

module.exports = {
  del,
};

/**
 * Deletes a file or folder in Google drive.
 * @param {Object} identifiers - An object identifying the file/folder
 * with either <code>fileId</code>/<code>folderId</code>
 * or <code>fileName</code>/<code>folderName</code>.
 * <code>parentId</code> and <code>parentName</code> properties may
 * also be included
 * @return {undefined} None
 * @example
 * // delete file "File Name" whose parent is "Folder Name"
 * utilsGDrive.del({fileName: "File Name", parentName: "Folder Name"});
 */
async function del(identifiers) {
  const fileId = await utils._resolveFId(identifiers);
  await this.drive.files.delete({fileId}, (error) => {
    if (error) return console.error(error);
    console.log(fileId, 'has been deleted');
  });
}