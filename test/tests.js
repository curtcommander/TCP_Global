'use strict';

const assert = require('assert').strict;
const utilsGDrive = require('utils-google-drive');
const fs = require('fs-extra');

const fileNameTest = 'TEST_TESTSITE';
const fileIdTest = '1f0o9p3pPwaCkZ9Y-P8IxY6jBpT68GjlB';
const mimeTypeTest = 'application/vnd.google-apps.folder';
const parentNameTest = 'testCountry';
const parentIdTest = '1l9Daem3u2dqBUPjq_SgKMNfx2Ti_zXFk';

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
});

describe('resolve identifiers', function() {
  it('_resolveParamsId(), string given', async function() {
    const fileId = await utilsGDrive._resolveParamsId('testId');
    assert(fileId === 'testId');
  });

  it('_resolveParamsId(), id property given', async function() {
    const fileId = await utilsGDrive._resolveParamsId({
      testId: 'testId',
      testName: 'testName',
    });
    assert(fileId === 'testId');
  });

  it('_resolveParamsId(), name property given', async function() {
    const fileId = await utilsGDrive._resolveParamsId({
      testName: fileNameTest,
    });
    assert(fileId === fileIdTest);
  });

  it('_resolveParamsId(), default to root', async function() {
    const fileId = await utilsGDrive._resolveParamsId({});
    assert(fileId === 'root');
  });

  it('_resolveFId(), string', async function() {
    const fileId = await utilsGDrive._resolveFId('testId');
    assert(fileId === 'testId');
  });

  it('_resolveFId(), file id given', async function() {
    const fileId = await utilsGDrive._resolveFId({
      fileId: fileIdTest,
      fileName: 'testName',
      test: 'test',
    });
    assert(fileId === fileIdTest);
  });

  it('_resolveFid(), file name given', async function() {
    const fileId = await utilsGDrive._resolveFId({
      fileName: fileNameTest,
    });
    assert(fileId === fileIdTest);
  });

  it('_resolveFid(), file name and parent id given', async function() {
    const fileId = await utilsGDrive._resolveFId({
      fileName: fileNameTest,
      parentId: parentIdTest,
    });
    assert(fileId == fileIdTest);
  });

  it('_resolveFid(), file name and parent name given', async function() {
    const fileId = await utilsGDrive._resolveFId({
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

  it('getFileId()', async function() {
    const fileId = await utilsGDrive.getFileId(fileNameTest, parentIdTest);
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

  let mkDirPassed;
  it('mkDir()', async function() {
    const fileId = await utilsGDrive.mkDir('testMkDir');
    const fileName = await utilsGDrive.getFileName(fileId);
    if (fileName === 'testMkDir') {
      mkDirPassed = true;
      assert(mkDirPassed);
    }
  });

  let uploadFilePassed;
  it('upload(), upload file', async function() {
    if (!mkDirPassed) this.skip();
    else {
      const fileId = await utilsGDrive.upload('test/testUploadFile.xlsx', {
        parentName: 'testMkDir',
      });
      const fileName = await utilsGDrive.getFileName(fileId);
      uploadFilePassed = fileName === 'testUploadFile.xlsx';
      assert(uploadFilePassed);
    }
  });

  let uploadFolderPassed;
  it('upload(), upload folder', async function() {
    if (!uploadFilePassed) this.skip();
    else {
      await utilsGDrive.upload('test/testUploadFolder', {
        parentName: 'testMkDir',
      });
      const children = await utilsGDrive.listChildren({
        fileName: 'testUploadFolder',
        parentName: 'testMkDir',
      });
      uploadFolderPassed = !!children.length;
      assert(uploadFolderPassed);
    }
  });

  let mvPassed;
  it('mv()', async function() {
    if (!uploadFolderPassed) this.skip();
    else {
      await utilsGDrive.mv(
          {fileName: 'testUploadFile.xlsx'},
          {parentName: 'testUploadFolder'},
      );
      const fileId = await utilsGDrive._resolveFId({
        fileName: 'testUploadFile.xlsx',
        parentName: 'testUploadFolder',
      });
      mvPassed = !!fileId;
      assert(mvPassed);
    }
  });

  let downloadFilePassed;
  it('download(), download file', async function() {
    if (!uploadFilePassed) this.skip();
    else {
      const fileName = 'testUploadFile.xlsx';
      await utilsGDrive.download({fileName}, 'test');
      return new Promise((resolve) => {
        setTimeout(function() {
          if (fs.readdirSync('test').indexOf(fileName) + 1) {
            if (fs.statSync('test/' + fileName).size) {
              downloadFilePassed = true;
            }
          }
          resolve(downloadFilePassed);
        }, 2000);
      });
    }
  });

  let downloadFolderPassed;
  it('download(), download folder', async function() {
    this.retries(2);
    if (!downloadFilePassed) this.skip();
    else {
      const folderName = 'testMkDir';
      await utilsGDrive.download({folderName}, 'test');
      if (fs.readdirSync('test').indexOf(folderName) + 1) {
        if (fs.readdirSync('test/' + folderName).length) {
          downloadFolderPassed = true;
        }
        fs.remove('test/' + folderName, (error) => {
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
      const fileIdRenamed = await utilsGDrive.getFileId('testUploadFile2.xlsx');
      assert(fileId === fileIdRenamed);
    }
  });

  it('del()', async function() {
    await utilsGDrive.del({fileName: 'testMkDir'});
    const files = await utilsGDrive.listFiles({
      q: 'name="testMkDir"',
    });
    assert(!files.length);
  });
});

describe('utilsGDriveError', function() {
  const consoleError = console.error;
  let output;
  beforeEach(function(done) {
    output = '';
    console.error = (msg) => {
      output += msg + '\n';
    };
    done();
  });

  afterEach(function() {
    console.error = consoleError;
    if (this.currentTest.state === 'failed') {
      console.error(output);
    }
  });

  it('getFiles(), file id not specified', function() {
    assert.rejects(function() {
      utilsGDrive.getFiles({shouldBeFileId: 'foo'});
    }, utilsGDrive.Error);
  });

  it('_resolveFId(), invalid property name', function() {
    assert.rejects(function() {
      utilsGDrive._resolveFId({f: fileNameTest});
    }, utilsGDrive.Error);
  });

  it('_checkExistsDrive(), file/folder already exists', async function() {
    const fileMetadata = {
      name: 'Daily Logs',
      mimeType: 'application/vnd.google-apps.folder',
      parents: ['19FWsjMbtZzfVnbUdDvGLdHKc3E3zXk0k'],
    };
    assert.rejects(async () => {
      await utilsGDrive._checkExistsDrive(fileMetadata);
    }, utilsGDrive.Error);
  });
});
