declare const module: {hot?: {accept: Function}}
module.hot && module.hot.accept()

import * as d3 from "d3"

interface Innermost {
  expression: number
  coef: number
  lower: number
  upper: number
  p: number
}

const missing = {
  expression: 0,
  coef: 0,
  lower: 0,
  upper: 0,
  p: 0,
  missing: true,
} as any as Innermost

type Loc = 'STROMA' | 'TUMOR'

type DB = Record<string, Record<string, Record<Loc, Innermost>>>

interface DBs {
  by_tumor: DB,
  by_cell: DB
}

declare const require: Function
const db: DBs = require('./db.json')

type Row = Innermost & { loc: Loc, cell: string, tumor: string }

const flat: Row[] = []

for (const [cell, i] of Object.entries(db.by_cell))  {
  for (const [tumor, j] of Object.entries(i)) {
    for (const [loc, inner] of Object.entries(j)) {
      flat.push({tumor, cell, loc: loc as Loc, ...inner})
    }
  }
}

/** Returns a copy of the array with duplicates removed, via reference equality */
export function uniq<A>(xs: A[]): A[] {
  const seen = new Set()
  return xs.filter(x => {
    const duplicate = seen.has(x)
    seen.add(x)
    return !duplicate
  })
}

function flatRange<A extends Record<string, any>>(d: A[]): {[K in keyof A]: A[K][]} {
  const out = {} as any
  for (const k of Object.keys(d[0])) {
    out[k] = uniq(d.map(x => x[k]))
  }
  return out
}

const range = flatRange(flat)

console.log(range)
console.log(flat)

const stripe_size = 6
const stripe_width = 2

const pattern = `
  <pattern id="stripe" patternUnits="userSpaceOnUse" width="${stripe_size}" height="${stripe_size}">
    <path d='M-1,1 l2,-2
       M0,${stripe_size} l${stripe_size},-${stripe_size}
       M${stripe_size-1},${stripe_size+1} l2,-2' stroke='white' stroke-width='${stripe_width}'/>
  </pattern>
`

document.body.innerHTML = `
  <style>
    pre {
      background: #e8e8e8;
      border-left: 2px #59f solid;
      padding: 4px;
    }
    svg {
      display: block;
    }
  </style>
  <svg xmlns="http://www.w3.org/2000/svg" version="1.1" id='bar'>
    <defs>${pattern}</defs>
  </svg>
  <svg xmlns="http://www.w3.org/2000/svg" version="1.1" id='forest'>
    <defs>${pattern}</defs>
  </svg>
  <pre>${JSON.stringify({range, flat}, undefined, 2)}</pre>
`
function bar() {

  const rows = flat.filter(row => row.tumor == 'Colon')

  const width = 900
  const height = 500

  const svg = d3.select('svg#bar')
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width)
    .attr("height", height)

  const margin = ({top: 20, right: 0, bottom: 30, left: 40})

  type G = d3.Selection<SVGGElement, unknown, HTMLElement, any>

  const z: d3.ScaleOrdinal<string, string> = d3.scaleOrdinal((d3 as any).schemeTableau10)
    .domain(range.cell) as any

  const x = d3.scaleBand()
      .domain(range.cell)
      .range([margin.left, width - margin.right])
      .padding(0.5)

  // https://www.d3-graph-gallery.com/graph/barplot_grouped_basicWide.html
  const x_subgroup = d3.scaleBand()
      .domain(range.loc)
      .range([0, x.bandwidth()])
      .padding(0.0)

  const xAxis = (g: G) => g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(i => i.replace('_', ' ')).tickSizeOuter(0))

  const y = d3.scaleLinear()
      .domain([0, d3.max(rows, row => row.expression) || 0]).nice()
      .range([height - margin.bottom, margin.top])

  const yAxis = (g: G) => g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .call(g => g.select(".domain").remove())

  svg.append("g")
      .attr("fill", "steelblue")
    .selectAll("rect")
    .data(rows)
    .join("rect")
      .attr("x", row => x(row.cell) + x_subgroup(row.loc))
      .attr("y", row => y(row.expression))
      .attr("height", row => y(0) - y(row.expression))
      .attr("width", x_subgroup.bandwidth())
      .attr("fill", row => z(row.cell))
      .clone()
      .attr("fill", row => row.loc == 'TUMOR' ? 'url(#stripe)' : 'none')

  svg.append("g")
      .call(xAxis)

  svg.append("g")
      .call(yAxis)

  return svg

}

function forest() {

  const rows = flat.filter(row => row.tumor == 'Colon')

  const width = 500
  const height = 500

  const svg = d3.select('svg#forest')
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width)
    .attr("height", height)

  const margin = ({top: 20, right: 0, bottom: 30, left: 100})

  type G = d3.Selection<SVGGElement, unknown, HTMLElement, any>

  const z: d3.ScaleOrdinal<string, string> = d3.scaleOrdinal((d3 as any).schemeTableau10)
    .domain(range.cell)

  const y = d3.scaleBand()
      .domain(range.cell)
      .range([margin.top, height - margin.bottom])
      .padding(0.2)

  // https://www.d3-graph-gallery.com/graph/barplot_grouped_basicWide.html
  const y_subgroup = d3.scaleBand()
      .domain(range.loc)
      .range([0, y.bandwidth()])
      .padding(0.2)

  const yAxis = (g: G) => g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickFormat(i => i.replace('_', ' ')).tickSizeOuter(0))
      .call(g => g.select(".domain").remove())

  const x = d3.scaleLinear()
      .domain([0, d3.max(rows, row => row.upper) || 0]).nice()
      .range([margin.left, width - margin.right])

  const xAxis = (g: G) => g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))

  svg.append('rect')
      .attr('y', margin.bottom)
      .attr('x', x(1))
      .attr('width', 1)
      .attr('height', height - margin.bottom - margin.top)
      .attr('fill', '#aaa')

  const g = svg.append("g")
    .selectAll("g")
    .data(rows)
    .join("g")

  g.append('rect')
     .attr("y", row => y(row.cell) + y_subgroup(row.loc) + y_subgroup.bandwidth() / 2 - 1)
     .attr("x", row => x(row.lower))
     .attr("width", row => x(row.upper) - x(row.lower))
     .attr("height", 2)
     .attr("fill", row => z(row.cell))
     .clone()
     .attr("fill", row => row.loc == 'TUMOR' ? 'url(#stripe)' : 'none')

  g.append('rect')
     .attr("y", row => y(row.cell) + y_subgroup(row.loc))
     .attr("x", row => x(row.coef))
     .attr("width", row => y_subgroup.bandwidth()) // x(0) - x(row.expression))
     .attr("height", y_subgroup.bandwidth())
     .attr("fill", row => z(row.cell))
     // .clone()
     // .attr("fill", row => row.loc == 'TUMOR' ? 'url(#stripe)' : 'none')

  svg.append("g")
      .call(xAxis)

  svg.append("g")
      .call(yAxis)

}

window.requestAnimationFrame(() => { const svg = bar(); forest() })

