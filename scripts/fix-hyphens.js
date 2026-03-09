/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs')

// Fix PDF hyphenation artifacts: 'сло- во' -> 'слово'
function fixHyphens(text) {
  if (!text) return text
  return text.replace(/([а-яёА-ЯЁa-zA-Z])- ([а-яёa-z])/g, '$1$2')
}

function fixObj(obj) {
  if (typeof obj === 'string') return fixHyphens(obj)
  if (Array.isArray(obj)) return obj.map(fixObj)
  if (obj && typeof obj === 'object') {
    const result = {}
    for (const [k, v] of Object.entries(obj)) {
      result[k] = fixObj(v)
    }
    return result
  }
  return obj
}

const dataPath = './src/data/textbook.json'
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
const fixed = fixObj(data)
fs.writeFileSync(dataPath, JSON.stringify(fixed, null, 2), 'utf8')

const verify = JSON.stringify(fixed)
const remaining = (verify.match(/[а-яёА-ЯЁa-zA-Z]- [а-яёa-z]/g) || []).length
console.log('Done! Remaining artifacts:', remaining)
