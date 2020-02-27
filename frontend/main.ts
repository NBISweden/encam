declare const module: {hot?: {accept: Function}}
module.hot && module.hot.accept()

import * as d3 from "d3"

interface Row {
  tumor: string
  cell: string
  location: string
  expression: number
  coef: number
  lower: number
  upper: number
  p: number
}

type DB = Row[]

declare const require: Function
const db: DB = require('./db.json')

window.db = db

/** Returns a copy of the array with duplicates removed, via reference equality */
export function uniq<A>(xs: A[]): A[] {
  const seen = new Set()
  return xs.filter(x => {
    const duplicate = seen.has(x)
    seen.add(x)
    return !duplicate
  })
}

function row_range<A extends Record<string, any>>(d: A[]): {[K in keyof A]: A[K][]} {
  const out = {} as any
  for (const k of Object.keys(d[0])) {
    out[k] = uniq(d.map(x => x[k]))
  }
  return out
}

const range = row_range(db)

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
`

type G = d3.Selection<SVGGElement, unknown, HTMLElement, any>
type SVG = d3.Selection<SVGSVGElement, unknown, HTMLElement, any>

interface Graph {
  caption(text: string): void
  svg: SVG
  size: Size
}

interface Margin {
  top: number
  right: number
  bottom: number
  left: number
}

interface Size extends Margin {
  width: number
  height: number
}

function graph(svg: SVG, size: Size): Graph {
  return {
    svg,
    size,
    caption(text) {
      const font_size = 13
      svg.append('text')
        .attr('x', size.width / 2)
        .attr('y', size.top - font_size)
        .attr('text-anchor', 'middle')
        .attr('font-size', font_size)
        .attr('font-family', 'sans-serif')
        .text(text)
    }
  }
}

function pretty(s: string) {
  const s2 = s.replace('_', ' ')
  return s2[0].toUpperCase() + s2.slice(1)
}

function bar(rows: Row[], group_by: 'cell' | 'tumor'): Graph {

  const margin = {top: 25, right: 0, bottom: 30, left: 30}

  const width = 50 * range[group_by].length + margin.left + margin.right
  const height = 200

  const svg = d3.select('body').append('svg')
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width)
    .attr("height", height)

  svg.append('defs').html(pattern)

  const z = d3.scaleOrdinal((d3 as any).schemeTableau10 as string[])
    .domain(range[group_by])

  const x = d3.scaleBand()
      .domain(range[group_by])
      .range([margin.left, width - margin.right])
      .padding(0.5)

  // https://www.d3-graph-gallery.com/graph/barplot_grouped_basicWide.html
  const x_subgroup = d3.scaleBand()
      .domain(range.location)
      .range([0, x.bandwidth()])
      .padding(0.0)

  const xAxis = (g: G) => g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(pretty).tickSizeOuter(0))

  const y = d3.scaleLinear()
      .domain([0, d3.max(rows, row => row.expression) || 0]).nice()
      .range([height - margin.bottom, margin.top])

  const yAxis = (g: G) => g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(8))
      .call(g => g.select(".domain").remove())

  const round = Math.round

  svg.append("g")
    .selectAll("rect")
    .data(rows)
    .join("rect")
      .attr("x", row => round(x(row[group_by]) + x_subgroup(row.location)))
      .attr("y", row => round(y(row.expression)))
      .attr("height", row => round(y(0) - y(row.expression)))
      .attr("width", round(x_subgroup.bandwidth()))
      .attr("fill", row => z(row[group_by]))
      .filter(row => row.location == 'TUMOR')
      .clone()
      .attr("fill", 'url(#stripe)')

  svg.append("g")
      .call(xAxis)

  svg.append("g")
      .call(yAxis)

  return graph(svg, {width, height, ...margin})

}

function forest(rows: Row[], group_by: 'cell' | 'tumor'): Graph {

  const margin = {top: 25, right: 0, bottom: 30, left: 80}

  const width = 500
  const height = 35 * range[group_by].length + margin.top + margin.bottom

  const svg = d3.select('body').append('svg')
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width)
    .attr("height", height)

  svg.append('defs').html(pattern)

  const z = d3.scaleOrdinal((d3 as any).schemeTableau10 as string[])
    .domain(range[group_by])

  const y = d3.scaleBand()
      .domain(range[group_by])
      .range([margin.top, height - margin.bottom])
      .padding(0.2)

  // https://www.d3-graph-gallery.com/graph/barplot_grouped_basicWide.html
  const y_subgroup = d3.scaleBand()
      .domain(range.location)
      .range([0, y.bandwidth()])
      .padding(0.2)

  const yAxis = (g: G) => g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickFormat(pretty).tickSizeOuter(0))
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

  const round = (i: number, snap=1) => Math.round(i / snap) * snap

  g.append('rect')
     .attr("y", row => round(y(row[group_by]) + y_subgroup(row.location), 2) + round(y_subgroup.bandwidth() / 2.0) - 1)
     .attr("x", row => round(x(row.lower)))
     .attr("width", row => round(x(row.upper) - x(row.lower)))
     .attr("height", 2)
     .attr("fill", row => z(row[group_by]))
     .filter(row => row.location == 'TUMOR')
     .clone()
     .attr("fill", 'url(#stripe)')

  g.append('rect')
     .attr("y", row => round(y(row[group_by]) + y_subgroup(row.location), 2))
     .attr("x", row => round(x(row.coef)))
     .attr("width", 2)
     .attr("height", round(y_subgroup.bandwidth(), 2))
     .attr("fill", row => z(row[group_by]))
     .clone()
     .attr("height", round(y_subgroup.bandwidth(), 2) - 4)
     .attr('transform', 'translate(0, 2)')
     .attr('x', row => round(x(row.lower)))
     .clone()
     .attr('x', row => round(x(row.upper) - 1))

  svg.append("g")
      .call(xAxis)

  svg.append("g")
      .call(yAxis)

  return graph(svg, {width, height, ...margin})
}

const filter = (by: 'cell' | 'tumor', value: string) => db.filter(row => row[by] == value)

range.cell.forEach(c => {
  bar   (filter('cell', c), 'tumor').caption(pretty(c))
  forest(filter('cell', c), 'tumor').caption(pretty(c))
})

range.tumor.forEach(t => {
  bar   (filter('tumor', t), 'cell').caption(pretty(t))
  forest(filter('tumor', t), 'cell').caption(pretty(t))
})

