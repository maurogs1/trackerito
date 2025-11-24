const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Disable package exports to force CommonJS resolution
// This prevents the "import.meta" error with Zustand and other ESM packages
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
