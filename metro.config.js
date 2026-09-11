const { URL: NodeURL, URLSearchParams: NodeURLSearchParams } = require('node:url');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Expo Router's server-side render runs the React Native bundle inside this very
// process, and React Native's setupURLPolyfill replaces globalThis.URL with a
// minimal implementation that has no static canParse(). Metro needs URL.canParse
// to parse bundle requests, so once a web route is rendered every later bundle
// request (Android included) fails with "URL.canParse is not a function".
// Restoring the Node implementation per request keeps Metro usable either way.
const baseEnhanceMiddleware = config.server.enhanceMiddleware;

config.server.enhanceMiddleware = (middleware, server) => {
  const enhanced = baseEnhanceMiddleware ? baseEnhanceMiddleware(middleware, server) : middleware;

  return (req, res, next) => {
    if (typeof globalThis.URL?.canParse !== 'function') {
      globalThis.URL = NodeURL;
      globalThis.URLSearchParams = NodeURLSearchParams;
    }
    return enhanced(req, res, next);
  };
};

module.exports = config;
