#!/usr/bin/env node

const path = require('path')
const fs = require('fs-extra')
const axios = require('axios')

const emojiJsonUrl = 'https://github.com/iamcal/emoji-data/raw/v4.1.0/emoji.json'
const target = path.resolve(__dirname, '..', 'lib', 'service', 'slack', 'emoji.json')

main()

async function main() {
  const {data} = await axios(emojiJsonUrl)
  const outputJson = {}
  for (const d of data) {
    const codes = d.unified.split('-').map((u) => parseInt(u, 16))
    const native = String.fromCodePoint.apply(null, codes)
    outputJson[d.short_name] = {
      x: d.sheet_x,
      y: d.sheet_y,
    }
    if (d.skin_variations) {
      for (const k in d.skin_variations) {
        const tone = skinToneToId(k)
        if (tone < 0)
          continue
        const s = d.skin_variations[k]
        outputJson[d.short_name + '::skin-tone-' + tone] = {
          x: s.sheet_x,
          y: s.sheet_y,
        }
      }
    }
  }

  await fs.writeJson(target, outputJson)
}

function skinToneToId(skin) {
  switch (skin) {
    case '1F3FB': return 2
    case '1F3FC': return 3
    case '1F3FD': return 4
    case '1F3FE': return 5
    case '1F3FF': return 6
    default: return -1
  }
}

function codeToNative(unified) {
  const codes = unified.split('-').map((u) => parseInt(u, 16))
  return String.fromCodePoint.apply(null, codes)
}
