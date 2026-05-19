const fs = require('fs')
const path = require('path')
const toIco = require('to-ico')

const png = fs.readFileSync(path.resolve(__dirname, '..', 'build', 'icon.png'))

const sizes = [16, 24, 32, 48, 64, 128, 256]

Promise.resolve(toIco(png, { resize: true, sizes })).then((buf) => {
  fs.writeFileSync(path.resolve(__dirname, '..', 'build', 'icon.ico'), buf)
  console.log('icon.ico created with sizes:', sizes.join(','))
}).catch((err) => {
  console.error(err)
  process.exit(1)
})
