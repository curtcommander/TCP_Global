#!/usr/bin/env node

'use strict';

const fs = require('fs');
const {_checkDrive} = require('./drive');
const utils = require('./utils');

moveFile = _checkDrive(moveFile);
async function moveFile({fileId, fileName, oldParentId, oldParentName, newParentId, newParentName}, drive) {
    const opts = arguments[0];
    
    await utils._collapseOptsToId(opts, 'oldParent', drive);
    await utils._collapseOptsToId(opts, 'newParent', drive);
    
    if (opts.fileId) {
        return _move();
    } else if (opts.fileName) {
        return utils.getFileId(opts.fileName, drive, {parentId: opts.oldParentId})
        .then(result => {
            opts.fileId = result[0];
            return _move();
        })
    }
    
    function _move() {
        drive.files.update({
            fileId: opts.fileId, 
            addParents: opts.newParentId, 
            enforceSingleParent: true
        }, (error, response) => {
            if (error) return console.error(error);
            console.log(opts.fileId, 'has been moved to directory', opts.newParentId)
        })
    }
}