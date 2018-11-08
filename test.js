/**
 @jest-environment node
 **/
const util = require('util')
const { join } = require('path')
const fs = require('fs')
const rimraf = require('rimraf')
const read = util.promisify(fs.readFile)
const access = util.promisify(fs.access)
const remove = util.promisify(rimraf)
const nextBuild = require('next/dist/build')
const withManifest = require('next-manifest')
const withSW = require('next-offline')
const cwd = process.cwd()

const forceProd = require('./forceProd')

beforeEach(() => {
  jest.setTimeout(20000)
  return remove(join(cwd, '.next'))
    .then(() => {
      return remove(join(cwd, 'static/manifest'))
    })
})

test('build next app', () => {
  const nextConf = {}
  return nextBuild.default(cwd, nextConf)
})

test('build next app with manifest', () => {
  const NAME = 'WithManifest'
  const nextConf = forceProd(withManifest({
    manifest: {
      name: NAME
    }
  }))
  return nextBuild.default(cwd, nextConf)
    .then(() => {
      return read(join(cwd, 'static/manifest/manifest.json'), 'utf8')
    })
    .then((str) => {
      const manifest = JSON.parse(str)
      expect(manifest.name).toBe(NAME)
    })
})

test('build next app with service worker', () => {
  const NAME = 'WithSW'
  const nextConf = withSW({

  })
  return nextBuild.default(cwd, nextConf)
    .then(() => {
      return access(join(cwd, '.next/service-worker.js'), fs.constants.F_OK)
    })
})

test('build next app with manifest and service worker', () => {
  const NAME = 'WithBoth'
  const nextConf = withSW(withManifest({
    manifest: {
      name: NAME
    }
  }))
  return nextBuild.default(cwd, nextConf)
    .then(() => {
      return Promise.all([
        read(join(cwd, 'static/manifest/manifest.json'), 'utf8')
          .then((str) => {
            const manifest = JSON.parse(str)
            expect(manifest.name).toBe(NAME)
          }),
        access(join(cwd, '.next/service-worker.js'), fs.constants.F_OK)
      ])
    })
})
