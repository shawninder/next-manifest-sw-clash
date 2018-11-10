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
  const nextConf = withSW({

  })
  return nextBuild.default(cwd, nextConf)
    .then(() => {
      return Promise.all([
        access(join(cwd, '.next/service-worker.js'), fs.constants.F_OK),
        read(join(cwd, '.next/main.js'), 'utf8')
          .then((str) => {
            expect(str).toEqual(expect.stringContaining('serviceWorker'))
          })
      ])
    })
})

test('build next app with manifest and service worker', () => {
  const NAME = 'WithBoth'
  const nextConf = withSW(forceProd(withManifest({
    manifest: {
      name: NAME
    }
  })))
  return nextBuild.default(cwd, nextConf)
    .then(() => {
      return Promise.all([
        read(join(cwd, 'static/manifest/manifest.json'), 'utf8')
          .then((str) => {
            const manifest = JSON.parse(str)
            expect(manifest.name).toBe(NAME)
          }),
        access(join(cwd, '.next/service-worker.js'), fs.constants.F_OK),
        read(join(cwd, '.next/main.js'), 'utf8')
          .then((str) => {
            expect(str).toEqual(expect.stringContaining('serviceWorker'))
          }),
        read(join(cwd, '.next/build-manifest.json'), 'utf8')
          .then((str) => {
            const obj = JSON.parse(str)
            const mainPath = obj.pages['/'].filter((item) => {
              return item.indexOf('static/runtime/main-') === 0 &&
                item.indexOf('.js') === item.length - 3
            })[0]
            console.log('mainPath', mainPath)
            expect(mainPath).toEqual(expect.stringContaining('static/runtime/main-'))
            return read(join(cwd, '.next', mainPath), 'utf8')
          })
          .then((str) => {
            expect(str).toEqual(expect.stringContaining('serviceWorkder'))
          })
      ])
    })
})
