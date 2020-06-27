#!/usr/bin/env node

'use strict';

const fs = require('fs');
const {_checkDrive} = require('./drive');
const LOG = require('./config').LOG;

module.exports = {API, _collapseOptsToFileId, listFiles, getFiles, getFileId,
                  getFileName, getMimeType, getMimeTypeFileId, getMimeTypeFileName,
                  listChildren, listChildrenFileId, listChildrenFileName};

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
function getFileId(fileName, drive) {
    return listFiles({q:'name="'+fileName+'"', fields:'files(id)'}, drive)
    .then((result) => {
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
    .then((result) => {
        const data = result[0];
        const drive = result[1];
        return [data.name, drive];
    })
}

// puts file id in opts
// thenned by a function that will access file id in opts
function _collapseOptsToFileId(opts, drive) {
    if (opts.fileId) {
        return new Promise((resolve) => {
            resolve(opts);
        })
    } else if (opts.fileName) {
        return getFileId(opts.fileName, drive)
        .then((result) => {
            opts.fileId = result[0];
            return opts;
        })
    }
}

// gets mime type given file id or file name
getMimeType = _checkDrive(getMimeType);
function getMimeType({fileId, fileName}, drive) {
    return _collapseOptsToFileId(arguments[0], drive)
    .then((opts) => {
        return getFiles({fileId: opts.fileId, fields: 'mimeType'}, drive)
        .then((result) => {
            console.log(result[0])
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
    return _collapseOptsToFileId(arguments[0], drive)
    .then((opts) => {
        let optsListChildren = {q : "'"+opts.fileId+"' in parents"};
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