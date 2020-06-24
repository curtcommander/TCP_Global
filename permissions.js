#!/usr/bin/env node

'use strict';

const fs = require('fs');
const {google} = require('googleapis');
const getDrive = require('./drive').getDrive;
const utils = require('./utils');

module.exports = {listPermissions, listPermissionsFile};

// base function for permissions resource's list method
function listPermissions(context, opts) {
    return utils.API(context, 'permissions', 'list', opts)
}

// lists permissions given file id or file name
function listPermissionsFile(context, {fileId, fileName} = {}) {
    return utils._collapseToFileId(context, arguments[1])
    .then((context) => listPermissions(context, {fileId: context.fileId}))
    .then((context) => {
        context.permissions = context.responseData.permissions;
        return context;
    })
}