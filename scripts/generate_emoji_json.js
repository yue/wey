#!/usr/bin/env node

const path = require('path')
const fs = require('fs-extra')
const axios = require('axios')

const emojiJsonUrl = 'https://github.com/iamcal/emoji-data/raw/master/emoji.json'
const target = path.resolve(__dirname, '..', 'lib', 'service', 'slack', 'emoji.json')

async function main() {
  const {data} = await axios(emojiJsonUrl)
  const outputJson = {}
  for (const d of data) {
    const codes = d.unified.split('-').map((u) => parseInt(u, 16))
    const native = String.fromCodePoint.apply(null, codes)
    for (const name of d.short_names) {
      outputJson[name] = {
        x: d.sheet_x,
        y: d.sheet_y,
        native,
      }
    }
  }

  await fs.writeJson(target, outputJson)
}

main()
