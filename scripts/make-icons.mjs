import { readFileSync, writeFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'

const svg = readFileSync('public/icon.svg', 'utf8')

for (const size of [180, 192, 512]) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } })
    .render()
    .asPng()
  writeFileSync(`public/icon-${size}.png`, png)
  console.log(`public/icon-${size}.png`)
}
