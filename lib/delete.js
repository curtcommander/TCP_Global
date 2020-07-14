#!/usr/bin/env node

'use strict';

const fs = require('fs');
const {_checkDrive} = require('./drive');
const utils = require('./utils');

// deletes a file
deleteFile = _checkDrive(deleteFile);
function deleteFile({fileId, fileName}, drive, {parentId, parentName} = {}) {
    const opts = arguments[0];

    if (opts.fileId) {
        return _delete();
    } else if (opts.fileName) {
        const parentOpts = arguments[2];
        if (parentOpts) {
            if (parentOpts.parentName === 'root') {
                parentOpts.parentId = 'root';
            }
        }
        return utils.getFileId(opts.fileName, drive, parentOpts)
        .then(result => {
            opts.fileId = result[0];
            _delete();
        })
    }
    
    function _delete() {
        return drive.files.delete({fileId: opts.fileId}, (error, response) => {
            if (error) return console.error(error);
            console.log(opts.fileId, 'has been deleted');
        })
    }
}

