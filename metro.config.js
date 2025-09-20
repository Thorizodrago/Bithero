const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver for problematic packages
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Exclude problematic packages from bundling
config.resolver.blacklistRE = /node_modules\/@stacks\/connect-ui/;

// Block problematic modules
config.resolver.blockList = [
	/node_modules\/@stacks\/connect-ui/,
	/node_modules\/@stacks\/connect\/.*connect-ui/
];

// Transform ignore patterns
config.transformer.getTransformOptions = async () => ({
	transform: {
		experimentalImportSupport: false,
		inlineRequires: true,
	},
});

module.exports = config;
