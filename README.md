# LibPwa

Bump the version
cd projects/lib-pwa/
npm version minor
cd ../../
TODO Do I need to copy the version number in the parent package.json file as well ?

Build the library
npm run package

Publish the library
npm publish ./dist/lib-pwa/stephaneeybert-lib-pwa-

In the client application
npm install ng-environmenter
npm install @stephaneeybert/lib-pwa
