#!/usr/bin/env node

'use strict';

const fs = require('fs');
const getDrive = require('./getDrive');
const {google} = require('googleapis');

module.exports = {list, get, getFileId, getFileName, listChildren}

// method can be 'list' or 'get'
function API(method, context, options, log=false) {
    return new Promise((resolve, reject) => {
        if (log) {
            console.log('Method: ', method)
            console.log('Options:', options)
        }
        context.drive.files[method](options, (error, result) => {
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
// lists files satisfying the query conditions (options.q)
function list(context, options) {
    // default value for fields property is 'files(name, id)'
    if (!options.fields) {
        options.fields = 'files(name, id)';
    }
    return API('list', context, options);
}

// API's get method
// gets info on the file with the file id specified (options.fileId)
function get(context, options) {
    // use context.fileId if fileId not provided
    if (!options.fileId && context.fileId) {
        options.fileId = context.fileId;
    }
    return API('get', context, options);
}

// gets file id given file name
function getFileId(context, fileName) {
    if (!fileName && context.fileName) {
        fileName = context.fileName;
    }
    return list(context, {q:'name="'+fileName+'"', fields:'files(id)'})
    .then((context) => {
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

// options properties either parentName or parentId
function listChildren(context, options) {
    if (!options.parentName && !options.parentId) {
        if (context.fileName) {
            options.parentName = context.fileName;
        } else if (context.fileId) {            
            options.parentId = context.fileId;
        }
    }
    if (options.parentName) {
        // get id of parent from name
        return getFileId(context, options.parentName)
        .then((context) => {list(context, {q: "'"+context.fileId+"' in parents"})})
        
    } else if (options.parentId) {
        return list(context, {q: "'"+options.parentId+"' in parents"})
    }
}