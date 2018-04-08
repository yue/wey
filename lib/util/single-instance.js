const crypto = require('crypto')
const fs     = require('fs')
const os     = require('os')
const net    = require('net')
const util   = require('util')
const gui    = require('gui')

const packageJson = require('../../package.json')

// Calculate hash depending on version, runtime, user... So we won't
// accidentally prevent launch when there are multiple users running program.
const hash = crypto.createHash('sha1')
                   .update(process.execPath)
                   .update(process.arch)
                   .update(os.userInfo().username)
                   .update(packageJson.name)
                   .update(packageJson.version)
                   .digest('base64')
                   .substring(0, 10)
                   .replace(/\+/g, '-')
                   .replace(/\//g, '_')

const socketName = `${packageJson.name}-${hash}.sock`
const socketPath = process.platform === 'win32' ? `\\\\.\\pipe\\${socketName}`
                                                : `${os.tmpdir()}/${socketName}`

// Turn connection into Promise.
function connectionPromise(connection) {
  return new Promise((resolve, reject) => {
    connection.on('connect', () => {
      resolve(true)
    })
    connection.on('error', (error) => {
      resolve(false)
    })
  })
}

// Return true if there is already an instance running
async function check() {
  const client = net.connect({path: socketPath})
  const connected = await connectionPromise(client)
  if (!connected)
    return false

  client.end('activate')
  return true
}

// Waiting for net.connect is slow, do a quick check first.
function quickCheckSync() {
  return fs.existsSync(socketPath)
}

// Clear the socket file.
function deleteSocketFile() {
  try {
    fs.unlinkSync(socketPath)
  } catch (e) {
  }
}

// Listen for new instances.
let server = null
function listen(callback) {
  if (server)
    throw new Error('Can not listen for twice')
  deleteSocketFile()
  server = net.createServer(callback)
  server.listen(socketPath)
  server.on('error', (error) => {
    console.error('Failed to listen for new instances', error)
  })
}

function clear() {
  server.close()
  deleteSocketFile()
}

module.exports = {check, quickCheckSync, listen, clear}
