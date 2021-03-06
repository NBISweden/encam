/**

  SVG stripes used for stroma throughout the page.

  I remember that getting this to work with Vega was quite annoying.

*/
const stripe_size = 4
const stripe_width = 1.2

const path = `
  <path d='M-1,1 l2,-2
     M0,${stripe_size} l${stripe_size},-${stripe_size}
     M${stripe_size - 1},${stripe_size + 1} l2,-2' stroke='white' stroke-width='${stripe_width}'/>
`

export const pattern = `
  <pattern id='stripe' patternUnits='userSpaceOnUse' width='${stripe_size}' height='${stripe_size}'>
    ${path}
  </pattern>
`

export const patternSVG = `
  <svg xmlns='http://www.w3.org/2000/svg' width='${stripe_size}' height='${stripe_size}'>
    ${path}
  </svg>
`
