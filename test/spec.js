'use strict';

const assert = require('assert').strict;
const utilsGDrive = require('../../utils-google-drive');
const fs = require('fs-extra');
const path = require('path');

const fileNameTest = 'Daily Logs';
const fileIdTest = '1Xsvaf0S00x-Tcq-HtxvCuUHnEgVE6W4X';
const mimeTypeTest = 'application/vnd.google-apps.folder';
const parentNameTest = 'TCP Global';
const parentIdTest = '19FWsjMbtZzfVnbUdDvGLdHKc3E3zXk0k';

describe('spec', function() {
  describe('setup', function() {
    it('add drive to instance of utilsGDrive', async function() {
      this.retries = 2;
      try {
        await utilsGDrive.api('files', 'get', {fileId: fileIdTest});
      } finally {
        assert(utilsGDrive.drive);
      }
    });

    it('drive populated with credentials from file', async function() {
      let accessToken;
      let clientId;
      let clientSecret;
      try {
        accessToken =
          utilsGDrive.drive.context._options.auth.credentials.access_token;
        clientId = utilsGDrive.drive.context._options.auth._clientId;
        clientSecret = utilsGDrive.drive.context._options.auth._clientSecret;
      } finally {
        assert(accessToken && clientId && clientSecret);
      }
    });

    it('can make requests to api', async function() {
      this.retries = 2;
      const responseData = await utilsGDrive.api('files', 'get', {
        fileId: fileIdTest,
      });
      assert(responseData);
    });

    it('throttles api requests', function() {
      const startTimes = [];
      for (let i = 1; i <= 10; ++i) {
        utilsGDrive.throttle(() => {
          startTimes.push(process.hrtime.bigint());
        });
      }
      utilsGDrive.throttle(() => {
        let testBool = startTimes.length === 10;
        if (testBool) {
          for (let i=2; i<=8; i+=2) {
            const timeDiff = (startTimes[i] - startTimes[i-2]);
            if (timeDiff < 200000000 || timeDiff > 205000000) {
              testBool = false;
              break;
            }
          }
        }
        assert(testBool);
      });
    });
  });

  describe('resolve identifiers', function() {
    it('_resolveId(), file id given as string', async function() {
      const fileId = await utilsGDrive._resolveId('testId');
      assert(fileId === 'testId');
    });

    it('_resolveId(), file id given as object property', async function() {
      const fileId = await utilsGDrive._resolveId({
        fileId: fileIdTest,
        fileName: 'testName',
        test: 'test',
      });
      assert(fileId === fileIdTest);
    });

    it('_resolveId(), path given as string', async function() {
      this.timeout(4000);
      const p = [parentNameTest, fileNameTest].join(path.sep);
      const fileId = await utilsGDrive._resolveId(p);
      assert(fileId === fileIdTest);
    });

    it('_resolveId(), file name given', async function() {
      const fileId = await utilsGDrive._resolveId({
        fileName: parentNameTest,
      });
      assert(fileId === parentIdTest);
    });

    it('_resolveId(), file name and parent id given', async function() {
      const fileId = await utilsGDrive._resolveId({
        fileName: fileNameTest,
        parentId: parentIdTest,
      });
      assert(fileId == fileIdTest);
    });

    it('_resolveId(), file name and parent name given', async function() {
      const fileId = await utilsGDrive._resolveId({
        fileName: fileNameTest,
        parentName: parentNameTest,
      });
      assert(fileId === fileIdTest);
    });
  });

  describe('utils', function() {
    this.timeout(5000);

    it('listFiles()', async function() {
      const files = await utilsGDrive.listFiles({fileId: fileIdTest});
      assert(files);
    });

    it('getFiles()', async function() {
      const responseData = await utilsGDrive.getFiles({
        fileId: fileIdTest,
        fields: 'name',
      });
      assert(responseData.name);
    });

    it('updateFiles()', async function() {
      const responseData = await utilsGDrive.updateFiles({fileId: fileIdTest});
      assert(responseData);
    });

    it('getFileId(), file id given as object property', async function() {
      const fileId = await utilsGDrive.getFileId({
        fileName: fileNameTest,
        parentId: parentIdTest,
      });
      assert(fileId === fileIdTest);
    });

    it('getFileId(), file name given as string', async function() {
      const fileId = await utilsGDrive.getFileId(fileNameTest);
      assert(fileId === fileIdTest);
    });

    it('getFileId(), path given as string', async function() {
      const p = [parentNameTest, fileNameTest].join(path.sep);
      const fileId = await utilsGDrive.getFileId(p);
      assert(fileId === fileIdTest);
    });

    it('getFileName()', async function() {
      const fileName = await utilsGDrive.getFileName(fileIdTest);
      assert(fileName === fileNameTest);
    });

    it('getMime()', async function() {
      const mimeType = await utilsGDrive.getMime(fileIdTest);
      assert(mimeType === mimeTypeTest);
    });

    it('listChildren()', async function() {
      const responseData = await utilsGDrive.listChildren({
        fileId: fileIdTest,
        fields: 'files(id)',
      });
      assert(Array.isArray(responseData));
    });
  });

  describe('other modules', function() {
    this.timeout(8000);

    let makeFolderPassed;
    it('makeFolder()', async function() {
      const fileId = await utilsGDrive.makeFolder('testMakeFolder');
      const fileName = await utilsGDrive.getFileName(fileId);
      if (fileName === 'testMakeFolder') {
        makeFolderPassed = true;
        assert(makeFolderPassed);
      }
    });

    let uploadFilePassed;
    it('upload(), upload file', async function() {
      if (!makeFolderPassed) this.skip();
      else {
        const fileId = await utilsGDrive.upload({
          localPath: 'test/testUploadFile.xlsx',
          parentIdentifiers: {
            fileName: 'testMakeFolder',
          },
        });
        const fileName = await utilsGDrive.getFileName(fileId);
        uploadFilePassed = fileName === 'testUploadFile.xlsx';
        assert(uploadFilePassed);
      }
    });

    it('upload(), overwrite', async function() {
      if (!uploadFilePassed) this.skip();
      await utilsGDrive.upload({
        localPath: 'test/testUploadFile.xlsx',
        parentIdentifiers: {
          fileName: 'testMakeFolder',
        },
        overwrite: true,
      });
      const files = await utilsGDrive.listChildren({
        fileName: 'testMakeFolder',
      });
      assert(files.length === 1);
    });

    let uploadFolderPassed;
    it('upload(), upload folder', async function() {
      if (!uploadFilePassed) this.skip();
      await utilsGDrive.upload({
        localPath: 'test/testUploadFolder',
        parentIdentifiers: {
          fileName: 'testMakeFolder',
        },
      });
      const children = await utilsGDrive.listChildren({
        fileName: 'testUploadFolder',
        parentName: 'testMakeFolder',
      });
      uploadFolderPassed = !!children.length;
      assert(uploadFolderPassed);
    });

    let movePassed;
    it('move()', async function() {
      if (!uploadFolderPassed) this.skip();
      else {
        await utilsGDrive.move(
            {fileName: 'testUploadFile.xlsx'},
            {fileName: 'testUploadFolder'},
        );
        const fileId = await utilsGDrive._resolveId({
          fileName: 'testUploadFile.xlsx',
          parentName: 'testUploadFolder',
        });
        movePassed = !!fileId;
        assert(movePassed);
      }
    });

    let downloadFilePassed;
    it('download(), download file', async function() {
      if (!uploadFilePassed) this.skip();
      else {
        const fileName = 'testUploadFile.xlsx';
        await utilsGDrive.download({fileName}, 'test');
        if (fs.readdirSync('test').indexOf(fileName) + 1) {
          if (fs.statSync('test/' + fileName).size) {
            downloadFilePassed = true;
            assert(true);
          }
        }
      }
    });

    let downloadFolderPassed;
    it('download(), download folder', async function() {
      if (!downloadFilePassed) this.skip();
      else {
        const fileName = 'testMakeFolder';
        await utilsGDrive.download({fileName}, 'test');
        if (fs.readdirSync('test').indexOf(fileName) + 1) {
          if (fs.readdirSync('test/' + fileName).length) {
            downloadFolderPassed = true;
          }
          fs.remove('test/' + fileName, (error) => {
            if (error) return console.error(error);
          });
        }
        assert(downloadFolderPassed);
      }
    });

    it('rename()', async function() {
      if (!uploadFilePassed) this.skip();
      else {
        const fileId = await utilsGDrive.getFileId('testUploadFile.xlsx');
        await utilsGDrive.rename(
            {fileName: 'testUploadFile.xlsx'},
            'testUploadFile2.xlsx',
        );
        const fileIdRenamed = await utilsGDrive.getFileId(
            'testUploadFile2.xlsx');
        assert(fileId === fileIdRenamed);
      }
    });

    it('del()', async function() {
      await utilsGDrive.del({fileName: 'testMakeFolder'});
      const files = await utilsGDrive.listFiles({
        q: 'name="testMakeFolder"',
      });
      assert(!files.length);
    });
  });
});

