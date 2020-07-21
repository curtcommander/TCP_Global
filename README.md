# utils-google-drive
Node package for interfacing with the Google Drive API. Documentation can be found [here](https://curtcommander.github.io/utils-google-drive/).

#### Flexible file/folder specification:
Files and folders in Google Drive can be specified by either name (`fileName`/`folderName`) or id (`fileId`/`folderId`).
Information on the parent folder can and many times should also be included (`parentName` or `parentId`).
For example, specifying a parent will resolve the ambiguity 
of specifying a file or folder by name when there are multiple files/folders in Google Drive with that name.

#### Features:
Perform the following actions on files and folders in Google Drive:
 - Get metadata
 ```javascript
// get id of folder in Google Drive whose name is "mainFolder"
// and whose parent folder is named "parentFolder"
utilsGDrive.getFileId({fileName: "mainFolder", parentName: "parentFolder"});
```
 - Change name
```javascript
// change name of folder from "beforeName" to "afterName"
utilsGDrive.rename({fileName: "beforeName"}, "afterName");
```
 - Download
 ```javascript
// download file "excelFile.xlsx" in the folder "dataFolder"
// to the local folder "driveDownloads"
utilsGDrive.download({fileName: "excelFile.xlsx", parentName: "dataFolder"}, "./driveDownloads");
```
 - Upload
 ```javascript
// upload file "report.pdf" in local folder "reports" 
// to the folder in Google Drive with the id "XXX_FOLDER_ID_XXX"
utilsGDrive.upload("./reports/report.pdf", {parentId: "XXX_FOLDER_ID_XXX"});
```
 - Move
 ```javascript
// move folder "reports" in Google Drive to root
utilsGDrive.mv({fileName: "reports"}, {parentId: "root"});
```
 - Delete
 ```javascript
// delete file with id "XXX_FILE_ID_XXX"
utilsGDrive.del({fileId: "XXX_FILE_ID_XXX"});
```
 - Make folders
```javascript
// make a new folder in the folder "parentFolder"
utilsGDrive.mkDir("newFolder", {parentName="parentFolder"});
```

#### Backlog:
 - Permissions
 - Asynchronous requests with rate limit constraint
 - Batch requests
