# utils-google-drive
Node package for interfacing with the Google Drive API.

Perform the following actions on files and folders in Google Drive:
 - Get metadata
 - Change name
 - Download
 - Upload
 - Move
 - Delete
 - Make folders
 
 Documentation can be found [here](https://curtcommander.github.io/utils-google-drive/).
 
 #### Flexible file/folder specification:
Files and folders in Google Drive can be specified by either name or id.
Information on the parent folder can and many times should also be included.
For example, specifying a parent will resolve the ambiguity 
of specifying a file or folder by name when there are multiple files/folders in Google Drive with that name.

Objects with the properties `fileId`/`folderId`, `fileName`/`folderName`, `parentId`, and `parentName` are generally used to specify a file or folder. For convenience, a string containing the file/folder id may also be used instead.
 
 #### Examples:
 ```javascript
// get id of folder in Google Drive whose name is "mainFolder"
// and whose parent folder is named "parentFolder"
utilsGDrive.getFileId({fileName: "mainFolder", parentName: "parentFolder"});

// change name of folder from "beforeName" to "afterName"
utilsGDrive.rename({fileName: "beforeName"}, "afterName");

// download file "excelFile.xlsx" in the folder "dataFolder"
// to the local folder "driveDownloads"
utilsGDrive.download({fileName: "excelFile.xlsx", parentName: "dataFolder"}, "path/to/driveDownloads");

// upload file "report.pdf" to the folder in Google Drive
// with the id "folderId"
utilsGDrive.upload('path/to/report.pdf', "folderId");

// move folder "reports" in Google Drive to root folder
// "root" is special API keyword
utilsGDrive.mv({fileName: "reports"}, {parentId: "root"});

// delete file with id "fileId"
utilsGDrive.del("fileId");

// make a new folder in the folder "parentFolder"
utilsGDrive.mkDir("newFolder", {parentName: "parentFolder"});
```

#### Backlog:
 - Permissions
 - Asynchronous requests with rate limit constraint
 - Batch requests
