#!/usr/bin/env node

'use strict';

const fs = require('fs');
const getDrive = require('./getDrive');
const {google} = require('googleapis');

module.exports = {list, get, getFileId, getFileName, getMimeType, listChildren};

getDrive.drive()
.then((context) => download(context, {fileName: 'Daily Logs'}))
//.then((context) => getMimeType(context))
.catch((error) => console.error(error))

// method can be 'list' or 'get'
function API(method, context, opts, log=true) {
    return new Promise((resolve, reject) => {
        if (log) {
            console.log('Method: ', method)
            console.log('Options:\n', opts)
        }
        context.drive.files[method](opts, (error, result) => {
            if (error) reject('Error from Google Drive API:', error);
            if (log) {
                console.log('Response Data:\n', result.data);
                console.log()
            }
            context.data = result.data;
            resolve(context);
        })
    })
}

// API's list method
// lists files satisfying the query conditions (opts.q)
function list(context, opts) {
    // default value for fields property is 'files(name, id)'
    if (!opts.fields) {
        opts.fields = 'files(name, id)';
    }
    return API('list', context, opts);
}

// API's get method
// gets info on the file with the file id specified (opts.fileId)
function get(context, opts) {
    // use context.fileId if fileId not provided
    if (!opts.fileId && context.fileId) {
        opts.fileId = context.fileId;
    }
    return API('get', context, opts);
}

// gets file id given file name
function getFileId(context, fileName) {
    if (!fileName && context.fileName) {
        fileName = context.fileName;
    }

    return list(context, {q:'name="'+fileName+'"', fields:'files(id)'})
    .then((context) => {
        if (context.data.files.length > 1) {
            throw new Error('Multiple files found for file name provided. Consider specifying parent.');
        }
        context.fileId = context.data.files[0].id;
        return context;
    })
}

// gets file name given file id
function getFileName(context, fileId) {
    if (!fileId && context.fileId) {
        fileId = context.fileId;
    }
    return get(context, {fileId: fileId, fields: 'name'})
    .then((context) => {
        context.fileName = context.data.name;
        return context;
    })
}

function getMimeType(context, {fileId, fileName} = {}) {

    function getMimeTypeFromId(context, fileId) {
        if (!fileId && context.fileId) {
            fileId = context.fileId
        }
        return get(context, {fileId: fileId, fields: 'mimeType'})
        .then((context) => {
            context.mimeType = context.data.mimeType;
            return context;
        })
    }

    const opts = arguments[1];
    if (opts) {
        // file id in opts
        if (opts.fileId) {
            return getMimeTypeFromId(context, opts.fileId)

        // file name in opts
        } else if (opts.fileName) {
            return getFileId(context, opts.fileName)
            .then((context) => getMimeTypeFromId(context))
        }

    // file id in context
    } else if (context.fileId) {
        return getMimeTypeFromId(context, context.fileId)

    // file name in context
    } else if (context.fileName) {
        return getFileId(context, context.fileName)
        .then((context) => getMimeTypeFromId(context))
    }
}

function listChildren(context, {fileId, fileName} = {}, fields ='files(name, id)') {
    const opts = arguments[1];
    if (opts) {
        // file id in opts
        if (opts.fileId) {
            let optsList = {
                q : "'"+opts.fileId+"' in parents",
                fields : fields
            }
            return list(context, optsList)

        // file name in opts
        } else if (opts.fileName) {
            return getFileId(context, opts.fileName)
            .then((context) => {
                let optsList = {
                    q:"'"+context.fileId+"' in parents",
                    fields : fields
                }
                list(context, optsList)
            })
        }

    // file id in context
    } else if (context.fileId) {
        let optsList = {
            q : "'"+context.fileId+"' in parents",
            fields : fields
        }
        return list(context, optsList)
    
    // file name in context
    } else if (context.fileName) {
        return getFileId(context, context.fileName)
        .then((context) => {
            let optsList = {
                q:"'"+context.fileId+"' in parents",
                fields : fields
            }
            list(context, optsList)
        })
    }
}