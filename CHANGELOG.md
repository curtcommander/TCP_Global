### v4.0.1 — *June 23, 2021*
* Fixed `upload` returning before overwrite complete when uploading a file

### v4.0.0 — *May 16, 2021*
* `download` and `upload` now throw errors. Errors for individual files/folders
don't stop execution as before, but these errors are no longer handled by 
`download` and `upload`. Instead, they are listed under a single error that is
thrown at the end of execution if any errors did occur
* Updated README and docs

### v3.0.3 — *April 9, 2021*
* Fixed `batch` and `refreshAccessToken` referencing token before creation

### v3.0.2 — *February 24, 2021*
* Fixed `del` returning before overwrite complete

### v3.0.1 — *November 18, 2020*
* Fixed examples for `makeFolder` and `upload` methods

### v3.0.0 — *November 11, 2020*
* Added batch requests
* Better error handling: Errors are logged for individual files in `download` and `upload`, thrown elsewhere
* Fixed `listFiles` only searching in trash when ignoreTrash parameter set to false
* Security update ([CVE-2020-7720](https://github.com/advisories/GHSA-92xj-mqp7-vmcj))

### v2.1.0 — *August 19, 2020*
* Added API request throttling

### v2.0.0 — *August 11, 2020*
* Better parent specification in `makeFolder`, `upload`, and `move` 
* Added ability to specify files with paths

### v1.0.3 — *July 27, 2020*
* Fixed files in Google Drive being orphaned by `makeFolder` and `upload` 

### v1.0.2 — *July 27, 2020*
* Fixed `upload` returning before files download completely

### v1.0.1 — *July 27, 2020*
* Bumped version because of issue with publishing to npm

### v1.0.0 — *July 26, 2020*
* Initial release