jsdoc index.js lib README.md -d docs -c ./jsdoc.json
sed -i 's/Global/Methods/g' docs/*.html
sed -i 's/global/methods/g' docs/*.html
mv docs/utilsGDrive.html UtilsGDrive.html
mv UtilsGDrive.html docs/
mv docs/global.html docs/methods.html