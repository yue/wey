#!/usr/bin/env node

const path = require('path')
const {spawn} = require('child_process')

const root = path.resolve(__dirname, '..')
const version = 'v' + require('../package.json').engines.yode
const yode = path.resolve(root, 'yode',
                          `yode-${version}-${process.platform}-${process.arch}`,
                          process.platform == 'win32' ? 'yode.exe' : 'yode')

const child = spawn(yode, ['--expose-gc', root])
child.stdout.pipe(process.stdout)
child.stderr.pipe(process.stderr)
