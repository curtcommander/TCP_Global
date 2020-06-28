#!/usr/bin/env node

'use strict';

const fs = require('fs');
const {_checkDrive} = require('./drive');
const {LOG} = require('./config');

module.exports = {API, _collapseOptsToFileId, _collapseOptsToParentId, listFiles, getFiles, 
                  deleteFile, getFileId, getFileName, getMimeType, getMimeTypeFileId, 
                  getMimeTypeFileName, listChildren, listChildrenFileId, listChildrenFileName,
                  deleteFile};

// base function for making requests
function API(drive, resource, method, opts) {
    return new Promise((resolve, reject) => {
        if (LOG) {
            console.log('Method: ', method)
            console.log('Options:\n', opts)
        }
        drive[resource][method](opts, (error, response) => {
            if (error) reject('Error from Google Drive API:', error);
            if (!response) console.log([resource, method, opts])
            if (response.status != 200) reject(response) ;
            if (LOG) {
                console.log('Response Data:\n', response.data);
                console.log();
            }
            resolve([response.data, drive])
        })
    })
}

// list method for API's files resource
// lists files satisfying the query conditions (opts.q)
listFiles = _checkDrive(listFiles);
function listFiles(opts, drive) {
    // default value for fields property
    if (!opts.fields) opts.fields = 'files(name, id, mimeType)';
    return API(drive, 'files', 'list', opts);
}

// get method for API's files resource
// gets info on the file with the file id specified (opts.fileId)
getFiles = _checkDrive(getFiles)
function getFiles(opts, drive) {
    // default value for fields property
    if (!opts.fields) opts.fields = 'name, id, mimeType';
    return API(drive, 'files', 'get', opts);
}

// gets file id given file name
getFileId = _checkDrive(getFileId);
async function getFileId(fileName, drive, {parentId, parentName} = {}) {
    const parentOpts = arguments[2];
    console.log(arguments)
    let q = 'name="'+fileName+'" and trashed=false'
    if (parentOpts) {
        await _collapseOptsToParentId(parentOpts, drive)
        q += ' and "'+parentOpts.parentId+'" in parents';
        
    }
    return listFiles({q:q, fields:'files(id)'}, drive)
    .then(result => {
        const data = result[0];
        const drive = result[1];
        if (data.files.length > 1) {
            throw new Error('Multiple files found for file name provided. Consider specifying parent.');
        }
        return [data.files[0].id, drive];
    })
}

// gets file name given file id
getFileName = _checkDrive(getFileName);
function getFileName(fileId, drive) {
    return getFiles({fileId: fileId, fields: 'name'}, drive)
    .then(result => {
        const data = result[0];
        const drive = result[1];
        return [data.name, drive];
    })
}

// propPrefix can be either 'file' or 'parent'
function _collapseOptsToId(opts, propPrefix, drive) {
    const propId = propPrefix+'Id';
    const propName = propPrefix+'Name';

    // id given
    if (opts[propId]) {
        return new Promise((resolve) => {
            resolve();
        })
    // name given
    } else if (opts[propName]) {
        return getFileId(opts[propName], drive)
        .then(result => {
            opts[propId] = result[0];
            return;
        })
    // use root as default if id nor name given
    } else {
        return new Promise((resolve) => {
            opts[propId] = 'root';
            resolve();
        })
    }
}

function _collapseOptsToFileId(opts, drive) {
    return _collapseOptsToId(opts, 'file', drive);
}

function _collapseOptsToParentId(opts, drive) {
    return _collapseOptsToId(opts, 'parent', drive);
}

// gets mime type given file id or file name
getMimeType = _checkDrive(getMimeType);
function getMimeType({fileId, fileName}, drive) {
    const opts = arguments[0];
    return _collapseOptsToFileId(opts, drive)
    .then(() => {
        return getFiles({fileId: opts.fileId, fields: 'mimeType'}, drive)
        .then((result) => {
            return [result[0].mimeType, result[1]];
        })
    })
}

// gets mime type given file id
function getMimeTypeFileId(fileId, drive) {
    return getMimeType({fileId}, drive);
}

// gets mime type given file name
function getMimeTypeFileName(fileName, drive) {
    return getMimeType({fileName}, drive);
}

// lists children given file id or file name
listChildren = _checkDrive(listChildren);
function listChildren({fileId, fileName, fields}, drive) {
    const opts = arguments[0];
    return _collapseOptsToFileId(opts, drive)
    .then(() => {
        let optsListChildren = {q : "'"+opts.fileId+"' in parents  and trashed=false"};
        if (opts.fields) {
            optsListChildren[fields] = opts.fields;
        }
        return listFiles(optsListChildren, drive)
    })
}

// lists children given file id
function listChildrenFileId(fileId, drive) {
    return listChildren({fileId}, drive);
}

// lists children given file name
function listChildrenFileName(fileName, drive) {
    return listChildren({fileName}, drive);
}

// deletes a file
deleteFile = _checkDrive(deleteFile);
function deleteFile({fileId, fileName}, drive, {parentId, parentName} = {}) {
    const opts = arguments[0];

    if (opts.fileId) {
        return _delete();
    } else if (opts.fileName) {
        const parentOpts = arguments[2];
        console.log(parentOpts)
        if (parentOpts) {
            if (parentOpts.parentName === 'root' ) {
                parentOpts.parentId = 'root';
            }
        }
        getFileId(opts.fileName, drive, parentOpts)
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