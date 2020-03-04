declare const module: {hot?: {accept: Function}}
module.hot && module.hot.accept()

import * as React from 'react'
import * as ReactDOM from 'react-dom'

import * as d3 from 'd3'

// declare const d3: typeof import('d3')

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

import * as random_js from 'random-js'

const make_gen = () => random_js.MersenneTwister19937.seed(84000)

function expand(rows: DB) {
  const gen = make_gen()
  const range = row_range(rows)
  const out = rows.slice()
  for (let i = 0; i < 8; ++i) {
    range.cell.forEach(cell => {
      range.location.forEach(location => {
        const proto = {...random_js.pick(gen, rows)}
        while (proto.upper > 2 && gen.next() % 10 != 0) {
          proto.coef *= 0.2
          proto.lower *= 0.2
          proto.upper *= 0.2
        }
        out.push({
          ...proto,
          tumor: 'type' + '₁₂₃₄₅₆₇₈₉'[i],
          cell,
          location,
        })
      })
    })
  }
  return out
}

declare const require: Function
const db: DB = expand(require('./db.json'))

window.db = db

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

function init_svg(width: number, height: number, margin: Margin): SVG {

  const width_ = width + margin.left + margin.right
  const height_ = height + margin.top + margin.bottom

  const target = document.querySelector('#target') ? d3.select('#target') : d3.select('body')

  const svg = target.append('svg')
    .attr('viewBox', `0 0 ${width_} ${height_}`)
    .attr('width', width_)
    .attr('height', height_)

  svg.append('defs').html(pattern)

  return svg
    .append('g')
    .attr('transform', translate(margin.left, margin.top)) as any as SVG
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
        .attr('y', - font_size)
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
  p: 0.5,
  w: 40,
}

function bar(rows: Row[], options?: Partial<typeof default_options>): Graph {

  const {inner_facet, outer_facet, color_by, legend, p, w} = {...default_options, ...options}

  const margin = {top: 25, right: legend ? 80 : 0, bottom: 30, left: 30}

  const outer_range = uniq(rows.map(row => row[outer_facet]))
  const inner_range = uniq(rows.map(row => row[inner_facet]))
  const color_range = uniq(rows.map(row => row[color_by]))

  // TODO: figure out the relationship between these constants to the padding constants
  const width =
    p * w * outer_range.length +
    w * outer_range.length * inner_range.length
  const height = 170

  const svg = init_svg(width, height, margin)

  const z = d3.scaleOrdinal((d3 as any).schemeTableau10 as string[])
    .domain(range[color_by])

  if (legend) {
    const box_size = 10

    const legend = svg.append('g')
      .selectAll('g')
      .data(color_range)
      .join('g')
      .attr('transform', (_, i) => translate(width + margin.right - box_size, 2.3 * box_size * i))

    legend.append('text')
      .text(pretty)
      .attr('x', -box_size / 2)
      .attr('y', box_size - 1)
      .attr('font-size', box_size)
      .attr('font-family', 'sans-serif')
      .attr('text-anchor', 'end')

    legend.append('rect')
      .attr('width', box_size)
      .attr('height', box_size)
      .attr('fill', z)
  }

  const x_outer = d3.scaleBand()
      .domain(outer_range)
      .range([0, width])
      .padding(0.0)

  const x_inner = d3.scaleBand()
      .domain(inner_range)
      .range([0, x_outer.bandwidth()])
      .paddingInner(0.0)
      .paddingOuter(p)

  const x = d3.scaleBand()
      .domain(range.location)
      .range([0, x_inner.bandwidth()])
      .paddingInner(0.0)
      .paddingOuter(0.15)

  svg.append('g')
      .attr('transform', translate(0, height))
      .call(d3.axisBottom(x_outer).tickFormat(pretty).tickSizeOuter(0))
      .selectAll('.tick>line').remove()

  const y = d3.scaleLinear()
      .domain([0, d3.max(rows, row => row.expression) || 0]).nice()
      .range([height, 0])

  svg.append('g')
      // .attr('transform', translate(margin.left, 0))
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

function forest(rows: Row[], group_by: CT, color_by = 'cell' as CT): Graph {

  const margin = {top: 25, right: 10, bottom: 30, left: 80}

  const width = 460
  const height = 35 * range[group_by].length

  const svg = init_svg(width, height, margin)

  const z = d3.scaleOrdinal((d3 as any).schemeTableau10 as string[])
    .domain(range[color_by])

  const y = d3.scaleBand()
      .domain(range[group_by])
      .range([0, height])
      .padding(0.2)

  const y_subgroup = d3.scaleBand()
      .domain(range.location)
      .range([0, y.bandwidth()])
      .padding(0.2)

  svg.append('g')
      .call(d3.axisLeft(y).tickFormat(pretty).tickSizeOuter(0))
      .select('.domain').remove()

  const x = d3.scaleLinear()
      .domain([0, d3.max(rows, row => Math.min(row.upper, 3)) || 0]).nice()
                                                       // ^ temporary hack to crop high numbers
      .range([0, width])

  svg.append('g')
      .attr('transform', translate(0, height))
      .call(d3.axisBottom(x))

  svg.append('rect')
      .attr('y', 0)
      .attr('x', x(1))
      .attr('width', 1)
      .attr('height', height)
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
     .attr('fill', row => z(row[color_by]))
     .filter(row => row.location == 'TUMOR')
     .clone()
     .attr('fill', 'url(#stripe)')

  g.append('rect')
     .attr('y', row => round(y(row[group_by]) + y_subgroup(row.location), 2))
     .attr('x', row => round(x(row.coef)))
     .attr('width', 2)
     .attr('height', round(y_subgroup.bandwidth(), 2))
     .attr('fill', row => z(row[color_by]))
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
    * {
      user-select: none;
    }
    .col {
      display: flex;
      flex-direction: column;
    }
    body {
      display: flex;
      flex-direction: row;
      font-family: sans-serif, sans;
    }
    h2 {
      margin-top: 1em;
      margin-bottom: 0.2em;
      margin-left: 1em;
      font-size: 1.1em;
    }
    #sidebar {
      margin-left: 1em;
      margin-right: 3em;
    }
  </style>
  <div id='sidebar'></div>
  <div id='target'></div>
`

import {Store, Lens} from 'reactive-lens'

const state0 = {
  tumor: {} as Record<string, boolean>,
  cell: {} as Record<string, boolean>,
}

type State = typeof state0

declare global {
  interface Window {
    store: Store<State> | undefined
  }
}

const store: Store<State> = Store.init(window.store ? window.store.get() : state0)

window.store = store

function Check(range: string[], store: Store<Record<string, boolean>>, on: () => void, color: (s: string) => string = () => 'black') {
  return range.map(x =>
    <label key={x}>
      <input style={{display:'none'}} type="checkbox" checked={store.get()[x] || false} onChange={e => {
        store.transaction(() => {
          store.set({...store.get(), [x]: e.target.checked})
          on()
        })}}/>
      <span style={
          {
            borderRadius: '100px',
            border: `2px ${color(x)} solid`,
            background: store.get()[x] ? color(x) : 'none',
            width: '0.5em',
            height: '0.6em',
            marginRight: '0.4em',
            display: 'inline-block',
          }
        }></span>
      {pretty(x)}
    </label>
  )
}

const cell_color = d3.scaleOrdinal((d3 as any).schemeTableau10 as string[])
    .domain(range.cell)

function Sidebar() {
  return (
    <div className="col">
      <h2>Tumor type</h2>
      {Check(range.tumor, store.at('tumor'), () => store.at('cell').set({}))}
      <h2>Cell type</h2>
      {Check(range.cell, store.at('cell'), () => store.at('tumor').set({}), cell_color)}
    </div>)
}

function redraw() {
  ReactDOM.render(<Sidebar/>, document.querySelector('#sidebar'))
}

window.requestAnimationFrame(redraw)

function clear(e: Element) {
  while (e.lastElementChild) {
    e.removeChild(e.lastElementChild)
  }
}

store.ondiff(redraw)
store.on(x => console.log(JSON.stringify(x)))
store.on(x => refresh())

function refresh() {
  const target = document.querySelector('#target')
  target && clear(target)
  const {tumor, cell} = store.get()
  const tumors = Object.entries(tumor).filter(([k, v]) => v).map(([k, v]) => k)
  const cells  = Object.entries(cell).filter(([k, v]) => v).map(([k, v]) => k)
  if (tumors.length) {
    const rows = db.filter(row => tumor[row.tumor])
    const cap = tumors.map(pretty).join(', ')

    if (tumors.length >= 2) {
      // bar(rows, {inner_facet: 'tumor', outer_facet: 'cell', color_by: 'cell', legend: false, p: 0.10, w: 40}).caption(cap)
      // bar(rows, {inner_facet: 'cell', outer_facet: 'tumor', color_by: 'cell', legend: true}).caption(cap)
    }

    tumors.forEach(t => {
      bar(filter('tumor', t), {inner_facet: 'tumor', outer_facet: 'cell', color_by: 'cell', legend: false, p: 0.10, w: 40}).caption(pretty(t))
      // bar(filter('tumor', t), {inner_facet: 'cell', outer_facet: 'tumor', color_by: 'cell', legend: true}).caption(pretty(t))
      forest(filter('tumor', t), 'cell').caption(pretty(t))
    })
  }
  if (cells.length) {
    const rows = db.filter(row => cell[row.cell])
    const cap = cells.map(pretty).join(', ')

    // if (cells.length >= 2) {
      bar(rows, {inner_facet: 'cell', outer_facet: 'tumor', color_by: 'cell'}).caption(cap)
      // bar(rows, {inner_facet: 'tumor', outer_facet: 'cell', color_by: 'tumor'}).caption(cap)
    // }

    cells.forEach(c => {
      // bar(pick_cells(c), {color_by: 'tumor', color_by: 'cell', legend: false, p: 0.2}).caption(pretty(c))
      forest(filter('cell', c), 'tumor').caption(pretty(c))
    })
  }
}

refresh()


function demo() {
  // bar(pick_cells('CD4'), {color_by: 'tumor', legend: false}).caption('CD4')
  // bar(pick_cells('CD4 CD8'), {inner_facet: 'cell', outer_facet: 'tumor', color_by: 'cell'})
  // bar(pick_cells('CD4 CD8 B_cells'), {inner_facet: 'cell', outer_facet: 'tumor', color_by: 'cell'})
  // bar(pick_cells('CD4 CD8 B_cells pDC'), {inner_facet: 'cell', outer_facet: 'tumor', color_by: 'cell'})
  // bar(pick_cells('CD4 CD8 B_cells pDC NKT'), {inner_facet: 'cell', outer_facet: 'tumor', color_by: 'cell'})
  // bar(pick_cells('CD4 CD8'))
  // bar(pick_cells('CD4 CD8 B_cells'))
  // bar(pick_cells('CD4 CD8 B_cells pDC'))
  // bar(pick_cells('CD4 CD8 B_cells pDC NKT'))

  // tranposed views when picking many cells:
  bar(pick_cells('CD4 CD8 B_cells pDC NKT'), {inner_facet: 'cell', outer_facet: 'tumor', color_by: 'cell'})
  bar(pick_cells('CD4 CD8 B_cells pDC NKT'), {inner_facet: 'tumor', outer_facet: 'cell', color_by: 'tumor'})

  // checking inner/outer facets of only one cell type:
  bar(pick_cells('CD4'), {inner_facet: 'cell', outer_facet: 'tumor', color_by: 'tumor', legend: false, p: 0.1}).caption('CD4')
  bar(pick_cells('CD4'), {inner_facet: 'cell', outer_facet: 'tumor', color_by: 'tumor', legend: false}).caption('CD4')
  bar(pick_cells('CD4'), {inner_facet: 'tumor', outer_facet: 'cell', color_by: 'tumor'})

  // one cell selected
  range.cell.forEach(c => {
    bar(pick_cells(c), {color_by: 'tumor', legend: false, p: 0.2}).caption(pretty(c))
    forest(filter('cell', c), 'tumor').caption(pretty(c))
  })

  // one tumor selected
  range.tumor.forEach(t => {
    bar(filter('tumor', t), {inner_facet: 'tumor', outer_facet: 'cell', color_by: 'cell', legend: false, p: 0.10, w: 40}).caption(pretty(t))
    bar(filter('tumor', t), {inner_facet: 'cell', outer_facet: 'tumor', color_by: 'cell', legend: true}).caption(pretty(t))
    forest(filter('tumor', t), 'cell').caption(pretty(t))
  })
}

// demo()
