#!/usr/bin/env node

'use strict';

const fs = require('fs');
const {google} = require('googleapis');
const getDrive = require('./drive').getDrive;
const LOG = require('./config').LOG;

module.exports = {API, _collapseToFileId, listFiles, getFiles, getFileId, getFileName, getMimeType, listChildren};

// base function for making requests
function API(context, resource, method, opts) {
    return new Promise((resolve, reject) => {
        if (LOG) {
            console.log('Method: ', method)
            console.log('Options:\n', opts)
        }
        context.drive[resource][method](opts, (error, response) => {
            if (error) reject('Error from Google Drive API:', error);
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
function listFiles(context, opts) {
    // default value for fields property
    if (!opts.fields) opts.fields = 'files(name, id, mimeType)';
    return API(context, 'files', 'list', opts);
}

// get method for API's files resource
// gets info on the file with the file id specified (opts.fileId)
function getFiles(context, opts) {
    // default value for fields property
    if (!opts.fields) opts.fields = 'name, id, mimeType';
    return API(context, 'files', 'get', opts);
}

// gets file id given file name
function getFileId(context, fileName) {
    if (!fileName && context.fileName) {
        fileName = context.fileName;
    }
    return listFiles(context, {q:'name="'+fileName+'"', fields:'files(id)'})
    .then((context) => {
        if (context.responseData.files.length > 1) {
            throw new Error('Multiple files found for file name provided. Consider specifying parent.');
        }
        context.fileId = context.responseData.files[0].id;
        return context;
    })
}

// gets file name given file id
function getFileName(context, fileId) {
    if (!fileId && context.fileId) {
        fileId = context.fileId;
    }
    return getFiles(context, {fileId: fileId, fields: 'name'})
    .then((context) => {
        context.fileName = context.responeData.name;
        return context;
    })
}

// puts file id in context
// thenned by a function that will access file id in context
function _collapseToFileId(context, opts) {
    
    if (opts.fileId) {
        return new Promise((resolve) => {
            context.fileId = opts.fileId;
            resolve(context);
        })

    } else if (opts.fileName) {
        return getFileId(context, opts.fileName)

    } else if (context.fileId) {
        return new Promise((resolve) => {
            resolve(context);
        })

    } else if (context.fileName) {
        return getFileId(context, context.fileName)
    }
}

// gets mime type given file id or file name
function getMimeType(context, {fileId, fileName} = {}) {
    
    return _collapseToFileId(context, arguments[1])
    .then(_getMimeTypeFromId)

    function _getMimeTypeFromId(context) {
        return getFiles(context, {fileId: context.fileId, fields: 'mimeType'})
        .then((context) => {
            context.mimeType = context.responseData.mimeType;
            return context;
        })
    }
}

// lists children given file id or file name
function listChildren(context, {fileId, fileName, fields} = {}) {
    return _collapseToFileId(context, arguments[1])
    .then((context) => {
        return listFiles(context, {q : "'"+context.fileId+"' in parents", fields : arguments[1].fields})
    })
}