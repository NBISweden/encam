declare const module: {hot?: {accept: Function}}
module.hot && module.hot.accept()

import * as d3 from 'd3'

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
  <pattern id='stripe' patternUnits='userSpaceOnUse' width='${stripe_size}' height='${stripe_size}'>
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

function init_svg(width: number, height: number): SVG {

  const svg = d3.select('body').append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', width)
    .attr('height', height)

  svg.append('defs').html(pattern)

  return svg

}

interface Graph {
  caption(text: string): Graph
  svg: SVG
  size: Size
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
      return this
    }
  }
}

function pretty(s: string) {
  const s2 = s.replace('_', ' ')
  if (s2.toLowerCase() == s2) {
    return s2[0].toUpperCase() + s2.slice(1)
  } else {
    return s2
  }
}

function translate(dx: number, dy: number) {
  return `translate(${dx}, ${dy})`
}

function round(i: number, snap=1) {
  return Math.round(i / snap) * snap
}


type CT = 'cell' | 'tumor'

const default_options = {
  inner_facet: 'cell' as CT,
  outer_facet: 'tumor' as CT,
  color_by: 'cell' as CT,
  legend: true,
}

function bar(rows: Row[], options?: Partial<typeof default_options>): Graph {

  const {inner_facet, outer_facet, color_by, legend} = {...default_options, ...options}

  const margin = {top: 25, right: legend ? 80 : 0, bottom: 30, left: 30}

  const outer_range = uniq(rows.map(row => row[outer_facet]))
  const inner_range = uniq(rows.map(row => row[inner_facet]))
  const color_range = uniq(rows.map(row => row[color_by]))

  // TODO: figure out the relationship between these constants to the padding constants
  const width =
    50 * outer_range.length +
    30 * outer_range.length * inner_range.length + margin.left + margin.right
  const height = 200

  const svg = init_svg(width, height)

  const z = d3.scaleOrdinal((d3 as any).schemeTableau10 as string[])
    .domain(range[color_by])

  if (legend) {
    const legend = svg.append('g')
      .selectAll('g')
      .data(color_range)
      .join('g')
      .attr('transform', (_, i) => translate(width - margin.right, margin.top + 23 * i))

    legend.append('text')
      .text(pretty)
      .attr('x', 20)
      .attr('y', 9)
      .attr('font-size', 10)
      .attr('font-family', 'sans-serif')

    legend.append('rect')
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', z)
  }

  const x_outer = d3.scaleBand()
      .domain(outer_range)
      .range([margin.left, width - margin.right])
      .padding(0.0)

  const x_inner = d3.scaleBand()
      .domain(inner_range)
      .range([0, x_outer.bandwidth()])
      .paddingInner(0.0)
      .paddingOuter(1.0)

  const x = d3.scaleBand()
      .domain(range.location)
      .range([0, x_inner.bandwidth()])
      .paddingInner(0.0)
      .paddingOuter(0.15)

  svg.append('g')
      .attr('transform', translate(0, height - margin.bottom))
      .call(d3.axisBottom(x_outer).tickFormat(pretty).tickSizeOuter(0))
      .selectAll('.tick>line').remove()

  const y = d3.scaleLinear()
      .domain([0, d3.max(rows, row => row.expression) || 0]).nice()
      .range([height - margin.bottom, margin.top])

  svg.append('g')
      .attr('transform', translate(margin.left, 0))
      .call(d3.axisLeft(y).ticks(8))
      .select('.domain').remove()

  svg.append('g')
    .selectAll('rect')
    .data(rows)
    .join('rect')
      .attr('x', row => round(x_outer(row[outer_facet]) + x_inner(row[inner_facet])) + round(x(row.location)))
      .attr('y', row => round(y(row.expression)))
      .attr('height', row => round(y(0) - y(row.expression)))
      .attr('width', round(x.bandwidth()))
      .attr('fill', row => z(row[color_by]))
      .filter(row => row.location == 'TUMOR')
      .clone()
      .attr('fill', 'url(#stripe)')

  return graph(svg, {width, height, ...margin})

}

function forest(rows: Row[], group_by: CT): Graph {

  const margin = {top: 25, right: 10, bottom: 30, left: 80}

  const width = 500
  const height = 35 * range[group_by].length + margin.top + margin.bottom

  const svg = init_svg(width, height)

  const z = d3.scaleOrdinal((d3 as any).schemeTableau10 as string[])
    .domain(range[group_by])

  const y = d3.scaleBand()
      .domain(range[group_by])
      .range([margin.top, height - margin.bottom])
      .padding(0.2)

  const y_subgroup = d3.scaleBand()
      .domain(range.location)
      .range([0, y.bandwidth()])
      .padding(0.2)

  svg.append('g')
      .attr('transform', translate(margin.left, 0))
      .call(d3.axisLeft(y).tickFormat(pretty).tickSizeOuter(0))
      .select('.domain').remove()

  const x = d3.scaleLinear()
      .domain([0, d3.max(rows, row => row.upper) || 0]).nice()
      .range([margin.left, width - margin.right])

  svg.append('g')
      .attr('transform', translate(0, height - margin.bottom))
      .call(d3.axisBottom(x))

  svg.append('rect')
      .attr('y', margin.bottom)
      .attr('x', x(1))
      .attr('width', 1)
      .attr('height', height - margin.bottom - margin.top)
      .attr('fill', '#aaa')

  const g = svg.append('g')
    .selectAll('g')
    .data(rows)
    .join('g')

  g.append('rect')
     .attr('y', row => round(y(row[group_by]) + y_subgroup(row.location), 2) + round(y_subgroup.bandwidth() / 2.0) - 1)
     .attr('x', row => round(x(row.lower)))
     .attr('width', row => round(x(row.upper) - x(row.lower)))
     .attr('height', 2)
     .attr('fill', row => z(row[group_by]))
     .filter(row => row.location == 'TUMOR')
     .clone()
     .attr('fill', 'url(#stripe)')

  g.append('rect')
     .attr('y', row => round(y(row[group_by]) + y_subgroup(row.location), 2))
     .attr('x', row => round(x(row.coef)))
     .attr('width', 2)
     .attr('height', round(y_subgroup.bandwidth(), 2))
     .attr('fill', row => z(row[group_by]))
     .clone()
     .attr('height', round(y_subgroup.bandwidth(), 2) - 4)
     .attr('transform', 'translate(0, 2)')
     .attr('x', row => round(x(row.lower)))
     .clone()
     .attr('x', row => round(x(row.upper) - 1))

  return graph(svg, {width, height, ...margin})
}

const filter = (by: 'cell' | 'tumor', value: string) => db.filter(row => row[by] == value)

const pick_cells = (s: string) => db.filter(row => s.split(' ').some(name => name == row.cell))

bar(pick_cells('CD4'), {color_by: 'tumor', legend: false}).caption('CD4')

bar(pick_cells('CD4 CD8'), {inner_facet: 'cell', outer_facet: 'tumor', color_by: 'cell'})
bar(pick_cells('CD4 CD8 B_cells'), {inner_facet: 'cell', outer_facet: 'tumor', color_by: 'cell'})
bar(pick_cells('CD4 CD8 B_cells pDC'), {inner_facet: 'cell', outer_facet: 'tumor', color_by: 'cell'})
bar(pick_cells('CD4 CD8 B_cells pDC NKT'), {inner_facet: 'cell', outer_facet: 'tumor', color_by: 'cell'})

bar(pick_cells('CD4 CD8'))
bar(pick_cells('CD4 CD8 B_cells'))
bar(pick_cells('CD4 CD8 B_cells pDC'))
bar(pick_cells('CD4 CD8 B_cells pDC NKT'))
bar(pick_cells('CD4 CD8 B_cells pDC NKT'), {inner_facet: 'tumor', outer_facet: 'cell', color_by: 'tumor'})

bar(pick_cells('CD4'), {inner_facet: 'tumor', outer_facet: 'cell', color_by: 'tumor'})
bar(pick_cells('CD4'), {inner_facet: 'cell', outer_facet: 'tumor', color_by: 'tumor'})

bar(pick_cells('CD4'), {inner_facet: 'cell', outer_facet: 'tumor', color_by: 'cell'})
bar(pick_cells('CD4 CD8'), {inner_facet: 'cell', outer_facet: 'tumor', color_by: 'cell'})
bar(filter('tumor', 'lung'), {inner_facet: 'cell', outer_facet: 'tumor', color_by: 'cell'})

range.cell.forEach(c => {
  forest(filter('cell', c), 'tumor').caption(pretty(c))
})

range.tumor.forEach(t => {
  forest(filter('tumor', t), 'cell').caption(pretty(t))
})
