#!/usr/bin/env node

'use strict';

const fs = require('fs');
const {_checkDrive} = require('./drive');
const utils = require('./utils');

const mimeTypesByExt = {
    'xlsx' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xlsm' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls'  : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt'  : 'text/plain',
    'html' : 'text/html',
    'htm'  : 'text/html',
    'csv'  : 'text/csv',
    'pdf'  : 'application/pdf',
    'docx' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'json' : 'application/vnd.google-apps.script+json',
    'jpeg' : 'image/jpeg',
    'jpg'  : 'image/jpeg',
    'png'  : 'image/png',
    'svg'  : 'image/svg+xml',
    'pptx' : 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'pptm' : 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'ppt'  : 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
}

uploadFile = _checkDrive(uploadFile);
function uploadFile({filePath, parentId, parentName}, drive) {
    const opts = arguments[0];

    _collapseOptsToParentId()
    .then(_checkFileExists)
    .then(_upload)
    .catch(error => console.error(error))
    

    // mimeType
    const ext = opts.filePath.slice(opts.filePath.lastIndexOf('.')+1);
    const mimeType = mimeTypesByExt[ext]
    
    // fileMetaData
    let idx = opts.filePath.lastIndexOf('/')
    if (idx == -1) idx = 0;
    const fileName = opts.filePath.slice(idx);
    const fileMetadata = {name: fileName};

    // media
    const media = {
        mimeType: mimeType,
        body: fs.createReadStream(opts.filePath)
    };

    function _collapseOptsToParentId() {  

        // parent id given
        if (opts.parentId) {
            return new Promise((resolve) => {
                resolve(opts.parentId);
            })

        // parent name given
        } else if (opts.parentName) {
            return utils.getFileId(opts.parentName, drive)
            .then(result => result[0])

        // use root as default if parent not specified
        } else {
            return new Promise((resolve) => {
                resolve('root');
            })
            
        }
    }

    function _checkFileExists(parentId) {
        const q = 'name="'+fileName+'" and mimeType="'+mimeType+'" and "'+parentId+'" in parents and trashed=false';
        return utils.listFiles({q:q}, drive)
        .then((result) => {
            return new Promise((resolve, reject) => {
                if (result[0].files.length !== 0) {
                    reject(new Error('File already exists in drive.'))
                } else {
                    fileMetadata.parents = [parentId]
                    resolve();
                }
            })
        })
    }

    function _upload() {
        drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'name, id, parents'
            }, function (error, file) {
                if (error) return console.error(err);
                console.log(fileName, 'created')
            }
        )
    }
}
