#!/usr/bin/env node

'use strict';

const fs = require('fs');
const {_checkDrive} = require('./drive');
const utils = require('./utils');

downloadFile = _checkDrive(downloadFile);
function downloadFile({fileId, fileName}, drive) {
    
    return utils._collapseOptsToFileId(arguments[0])
    .then(opts => _getFileMetadata(opts.fileId))
    .then(metadata => _download(metadata))
    
    function _getFileMetadata(fileId) {
        return utils.getFiles({fileId, fields: 'name, id, mimeType'}, drive)
        .then(result => {
            const responseData = result[0];
            const metadata = {
                fileId : responseData.id,
                fileName : responseData.name, 
                mimeType : responseData.mimeType
            }
            console.log('Retrieved metadata for', metadata.fileName)
            return metadata;
        })
    }

    function _download(metadata) {
        // folder specified, throw error
         if (metadata.mimeType === 'application/vnd.google-apps.folder') {
             return console.error(new Error('A directory (rather than a file) was specified.'))
         }
        // download file
        const dest = fs.createWriteStream(metadata.fileName);
        return drive.files.get({fileId: metadata.fileId, alt: 'media'}, {responseType: 'stream'},
        (error, response) => {
            if (error) return console.error(error);
            response.data
            .on('end', () => {
                console.log('Downloaded', metadata.fileName);
            })
            .on('error', error => {
                console.log('Error while downloading', metadata.fileName+':', error);
            })
            .pipe(dest);
        })
    }
}

function downloadFileId(fileId, drive) {
    return downloadFile({fileId}, drive)
}

function downloadFileName(fileName, drive) {
    return downloadFile({fileName}, drive)
}