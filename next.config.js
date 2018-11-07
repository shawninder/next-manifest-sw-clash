const compose = require('lodash/fp/compose')
const withManifest = require('next-manifest')
const withSW = require('next-offline')
const manifest = require('./manifest.js')

module.exports = compose([
  withManifest,
  withSW
])({ manifest })
