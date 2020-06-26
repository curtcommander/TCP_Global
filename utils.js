#!/usr/bin/env node

'use strict';

const fs = require('fs');
const {_checkDrive} = require('./drive');
const LOG = require('./config').LOG;

module.exports = {API, _collapseOptsToFileId, listFiles, getFiles, getFileId,
                  getFileName, getMimeType, getMimeTypeFileId, getMimeTypeFileName,
                  listChildren, listChildrenFileId, listChildrenFileName};

// base function for making requests
function API(context, resource, method, opts) {
    return new Promise((resolve, reject) => {
        if (LOG) {
            console.log('Method: ', method)
            console.log('Options:\n', opts)
        }
        context.drive[resource][method](opts, (error, response) => {
            if (error) reject('Error from Google Drive API:', error);
            if (!response) {console.log(context)}
            if (response.status != 200) reject(response) 
            if (LOG) {
                console.log('Response Data:\n', response.data);
                console.log();
            }
            context.responseData = response.data;
            resolve(context);
        })
    })
}

// list method for API's files resource
// lists files satisfying the query conditions (opts.q)
listFiles = _checkDrive(listFiles);
function listFiles(opts, context) {
    // default value for fields property
    if (!opts.fields) opts.fields = 'files(name, id, mimeType)';
    return API(context, 'files', 'list', opts);
}

// get method for API's files resource
// gets info on the file with the file id specified (opts.fileId)
getFiles = _checkDrive(getFiles)
function getFiles(opts, context) {
    // default value for fields property
    if (!opts.fields) opts.fields = 'name, id, mimeType';
    return API(context, 'files', 'get', opts);
}

// gets file id given file name
getFileId = _checkDrive(getFileId);
async function getFileId(fileName, context) {
    if (!fileName && context.fileName) {
        fileName = context.fileName;
    }
    await listFiles({q:'name="'+fileName+'"', fields:'files(id)'}, context)
    if (context.responseData.files.length > 1) {
        throw new Error('Multiple files found for file name provided. Consider specifying parent.');
    }
    context.fileId = context.responseData.files[0].id;
    return context;
}

// gets file name given file id
getFileName = _checkDrive(getFileName);
async function getFileName(fileId, context) {
    if (!fileId && context.fileId) {
        fileId = context.fileId;
    }
    await getFiles({fileId: fileId, fields: 'name'}, context)
    context.fileName = context.responseData.name;
    return context;
}

// puts file id in opts
// thenned by a function that will access file id in opts
function _collapseOptsToFileId(opts, context) {
    if (opts) {
        if (opts.fileId) {
            return new Promise((resolve) => {
                resolve([opts, context]);
            })
        } else if (opts.fileName) {
            return getFileId(opts.fileName, context)
            .then((context) => {
                opts.fileId = context.fileId;
                return [opts, context]
            })
        }
    } else if (context.fileId) {
        return new Promise((resolve) => {
            const opts = {fildId : context.fileId};
            resolve([opts, context]);
        })
    } else if (context.fileName) {
        return getFileId(context.fileName, context)
        .then((context) => {
            const opts = {fileId : context.fileId};
            return [opts, context]
        })
    }
}

// gets mime type given file id or file name
getMimeType = _checkDrive(getMimeType);
function getMimeType({fileId, fileName} = {}, context) {
    
    return _collapseOptsToFileId(arguments[1], context)
    .then((result) => _getMimeTypeFromId(result[0], result[1]))

    async function _getMimeTypeFromId(opts, context) {
        await getFiles({fileId: opts.fileId, fields: 'mimeType'}, context)
        context.mimeType = context.responseData.mimeType;
        return context;
    }
}

// gets mime type given file id
function getMimeTypeFileId(fileId, context) {
    return getMimeType({fileId}, context);
}

// gets mime type given file name
function getMimeTypeFileName(fileName, context) {
    return getMimeType({fileName}, context);
}

// lists children given file id or file name
listChildren = _checkDrive(listChildren);
function listChildren({fileId, fileName, fields} = {}, context) {
    return _collapseOptsToFileId(arguments[1], context)
    .then((result) => {
        const context = result[0];
        const opts = result[1];
        let optsListChildren = {q : "'"+opts.fileId+"' in parents"};
        if (opts.fields) {
            optsListChildren[fields] = opts.fields;
        }
        return listFiles(optsListChildren, context)
    })
}

// lists children given file id
function listChildrenFileId(fileId, context) {
    return listChildren({fileId}, context);
}

// lists children given file name
function listChildrenFileName(fileName, context) {
    return listChildren({fileName}, context);
}