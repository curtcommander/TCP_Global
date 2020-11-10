'use strict';

const assert = require('assert').strict;
const utilsGDrive = require('../../utils-google-drive');

const fileIdTest = '1Xsvaf0S00x-Tcq-HtxvCuUHnEgVE6W4X';
const parentIdTest = '19FWsjMbtZzfVnbUdDvGLdHKc3E3zXk0k';

describe('errors', function() {
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

  it('api(), handle error from response', function() {
    assert.rejects(async () => {
      await utilsGDrive.api('files', 'list', {q: 'test1234'});
    });
  });

  it('getFiles(), file id not specified', function() {
    assert.rejects(async function() {
      await utilsGDrive.getFiles({shouldBeFileId: 'foo'});
    }, utilsGDrive.Error);
  });

  it('updateFiles(), file id not specified', function() {
    assert.rejects(async function() {
      await utilsGDrive.updateFiles({shouldBeFileId: 'foo'});
    }, utilsGDrive.Error);
  });

  it('getMime(), invalid identifier name', async function() {
    assert.rejects(async () => {
      await utilsGDrive.getMime({f: fileIdTest});
    });
  });

  it('listChildren(), invalid identifier name', async function() {
    assert.rejects(async () => {
      await utilsGDrive.listChildren({f: fileIdTest}, 'files(id)');
    });
  });

  it('download(), invalid identifier name', async function() {
    assert.rejects(async () => {
      await utilsGDrive.download({f: 'test'}, '.');
    });
  });

  it('upload(), invalid identifier name', async function() {
    assert.rejects(async () => {
      await utilsGDrive.upload({
        localPath: 'test',
        parentIdentifiers: {f: 'test'},
      });
    });
  });

  it('makeFolder(), invalid identifier name', async function() {
    assert.rejects(async () => {
      await utilsGDrive.makeFolder({
        folderName: 'test',
        parentIdentifiers: {f: 'test'},
      });
    });
  });

  it('move(), invalid identifier name', async function() {
    assert.rejects(async () => {
      await utilsGDrive.move({f: 'test'});
    });
  });

  it('rename(), invalid identifier name', async function() {
    assert.rejects(async () => {
      await utilsGDrive.rename({f: 'test'});
    });
  });

  it('del(), invalid identifier name', async function() {
    assert.rejects(async () => {
      await utilsGDrive.del({f: fileIdTest});
    });
  });

  it('_checkExistsDrive(), file/folder already exists', async function() {
    const fileMetadata = {
      name: 'Daily Logs',
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentIdTest],
    };
    assert.rejects(async () => {
      await utilsGDrive._checkExistsDrive(fileMetadata);
    }, utilsGDrive.Error);
  });

  it('_checkUniqueIdent(), multiple files found', async function() {
    let e;
    try {
      await utilsGDrive._checkUniqueIdent([1, 2], 'test message');
    } catch (err) {
      e = err;
    }
    assert(e instanceof utilsGDrive.Error);
  });

  it('_checkUniqueIdent(), no files found', async function() {
    let e;
    try {
      await utilsGDrive._checkUniqueIdent([], 'test message');
    } catch (err) {
      e = err;
    }assert(e instanceof utilsGDrive.Error);
  });
});

