/**
  This is only used in development to output a JSON object of colours for
  the cells in the console to be pasted into the code for plotting.
*/

import ColorThief from 'colorthief'
const colorThief = new ColorThief()

const thieved = {} as Record<string, string>

export function thief(cell: string, e: HTMLImageElement) {
  if (e && e.complete) {
    const nice = (rgb: [number, number, number], i: number) => {
      const [r, g, b] = rgb
      const dist = Math.max(...rgb) - Math.min(...rgb)
      const avg = (r + g + b) / 3
      console.log(
        `%c  %c ${cell} ${dist} ${avg} ${rgb.join(', ')}`,
        `background:rgb(${rgb.join(',')})`,
        `background: unset`
      )
      return dist > 20 && avg < 210 && (cell != 'iDC' || i > 2) && (cell != 'CD4' || i > 0)
    }
    const p = colorThief.getPalette(e).filter(nice)
    thieved[cell] = `rgb(${p[0].join(',')})`
    console.log(JSON.stringify(thieved))
  }
}
