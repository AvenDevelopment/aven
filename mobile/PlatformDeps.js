const React = require("react");
const ReactNative = require("react-native");

const Platform = {
  web: false,
  webServer: false,
  webBrowser: false,
  mobile: true,
  ...ReactNative.Platform,
};
const platformDeps = {
  Platform,
  React,
  _npm_react: React,
  _npm_react_dom: null,
  _npm_react_native: ReactNative,
  _npm_react_native_web: null,
  _npm_react_navigation: require("react-navigation"),
  _npm_react_native_elements: require("react-native-elements"),
  _npm_luxon: require("luxon"),
  _npm_react_native_markdown_renderer: require("react-native-markdown-renderer"),
  _npm_remarkable: null,
  BrowserHistory: null,
  _npm_js_cookie: null,
};

module.exports = platformDeps;
