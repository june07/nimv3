const fs = require('fs');

// Read the package.json file
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const packageVersion = packageJson.version;

// Read the manifest.json file
const manifestPath = 'manifest.json';
const manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Update the version and version_name in the manifest.json file
manifestJson.version = packageVersion;
manifestJson.version_name = packageVersion;

// Write the updated manifest.json back to the file
fs.writeFileSync(manifestPath, JSON.stringify(manifestJson, null, 2) + '\n');

console.log(`Updated manifest.json with version ${packageVersion}`);
