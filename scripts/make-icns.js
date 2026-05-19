const fs = require('fs')
const path = require('path')

const png = fs.readFileSync(path.resolve(__dirname, '..', 'build', 'icon.png'))
const icns = require('icns-lib')

const icons = {
  ic10: png
}

fs.writeFileSync(path.resolve(__dirname, '..', 'build', 'icon.icns'), icns.format(icons))
console.log('icon.icns created')
