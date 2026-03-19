const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Force the project root to ensure assets are resolved correctly from this directory
config.projectRoot = projectRoot;
config.watchFolders = [projectRoot];

module.exports = config;
