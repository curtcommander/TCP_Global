# **utils-google-drive**
[![Build Status](https://travis-ci.com/curtcommander/utils-google-drive.svg?branch=master)](https://travis-ci.com/curtcommander/utils-google-drive)
[![npm version](https://badge.fury.io/js/utils-google-drive.svg)](https://www.npmjs.com/package/utils-google-drive)
[![repo](https://img.shields.io/badge/repo-gray.svg)](https://github.com/curtcommander/utils-google-drive)
[![docs](https://img.shields.io/badge/docs-gray.svg)](https://curtcommander.github.io/utils-google-drive/)

A simple and flexible package for interacting with Google Drive.

Perform the following actions on files and folders in Google Drive:
 - Get metadata
 - Change name
 - Download
 - Upload
 - Move
 - Delete
 - Make folders
 
## **Flexible file/folder specification**
utils-google-drive allows files and folders in Google Drive to be specified by either name or id. Information on the parent folder can and many times should also be included. Specifying a parent will resolve the ambiguity of trying to access a file or folder by name when there are multiple files/folders in Google Drive with that name.

Objects with the properties `fileId`, `fileName`, `parentId`, and `parentName` are generally used to specify a file or folder and are passed as arguments to utils-google-drive methods. For convenience, a string containing the file/folder id or path to the file or folder in Google Drive may be passed instead.

If specifying a path, partial paths can be used and are encouraged. Ideally, you would specify a partial path that contains just enough information to uniquely identify the file in Google Drive. For example, suppose you wanted to download the file "annualReport.pdf" in the folder "reports2020". If there are multiple files named "annualReport.pdf" in Google Drive but no other folders with the name "reports2020", you could use the partial path `"reports2020/annualReport.pdf"` to identify the file of interest. This path is preferable to a longer one because it finds the file quicker, jumping in at the uniquely-named folder "reports2020" and not worrying itself with folders higher up the chain.

There is some variation in how to specify a file or folder across utils-google-drive methods. Consult the [docs](https://curtcommander.github.io/utils-google-drive/) for details.
 
## **Examples**
```javascript
const utilsGDrive = require("utils-google-drive");
 
// get id of folder in Google Drive whose name is "mainFolder"
// and whose parent folder is named "parentFolder"
utilsGDrive.getFileId({
  fileName: "mainFolder",
  parentName: "parentFolder"
});

// change name of folder from "beforeName" to "afterName"
utilsGDrive.rename({folderName: "beforeName"}, "afterName");

// download file "excelFile.xlsx" in the folder "dataFolder"
// to the local folder "driveDownloads"
utilsGDrive.download({
  fileName: "excelFile.xlsx",
  parentName: "dataFolder"
}, "path/to/driveDownloads");

// upload file "report.pdf" to the folder in Google Drive
// with the id "folderId"
utilsGDrive.upload({
  localPath: "path/to/report.pdf",
  parentId: "folderId" 
});

// move folder "reports2020" to the folder "reports"
utilsGDrive.move("path/to/reports2020", "path/to/reports");

// delete file with id "fileId"
utilsGDrive.del("fileId");

// make a new folder in the folder "parentFolder"
utilsGDrive.makeFolder("newFolder", {parentName: "parentFolder"});
```

## **Installation**
```
npm install utils-google-drive
```
 
## **Setup**
You'll need to set up a Google Cloud project to access your user account's Google Drive. Follow step 1 at this [link](https://developers.google.com/drive/api/v3/quickstart/nodejs) to start a such a project, enable the Google Drive API, and download credentials all in one step.
Be sure you're logged in to the correct Google account when doing so.

For existing Google Cloud projects, you'll have to enable the API and download the credentials
in the [Google Cloud Console](https://console.developers.google.com/). Simply search for the Google Drive API at the top and click enable.
The OAuth credentials you'll need can be created and downloaded in the Credentials section under APIs and Services.

Once you've downloaded the credentials file, place it in your working directory and ensure it is named credentialsGDrive.json. 

The first time a method from utils-google-drive is executed, you'll be prompted in the console to authorize the app.
Follow the link and enter the code. A file named tokenGDrive.json containing an authorization token will be created in your working directory and setup will then be complete.
