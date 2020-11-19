# LibPwa

# Bump the library project version
cd projects/lib-pwa/;
npm version patch;
cd ../../;

# Build the library
npm run package;

# Sync the workspace version to the library project one
ng-version-sync-parent;

# Publish the library
npm publish ./dist/lib-pwa/stephaneeybert-lib-pwa-

# Install the dependencies in the client application
npm install ng-environmenter
npm install @stephaneeybert/lib-pwa

# Serve again the client application
Ctrl+C
ng serve