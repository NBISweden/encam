
import * as React from 'react'
import * as d3 from 'd3'

import {CT, Row, range, pretty, uniq} from './db'

const stripe_size = 6
const stripe_width = 2

export const pattern = `
  <pattern id='stripe' patternUnits='userSpaceOnUse' width='${stripe_size}' height='${stripe_size}'>
    <path d='M-1,1 l2,-2
       M0,${stripe_size} l${stripe_size},-${stripe_size}
       M${stripe_size-1},${stripe_size+1} l2,-2' stroke='white' stroke-width='${stripe_width}'/>
  </pattern>
`

export type G = d3.Selection<SVGGElement, unknown, HTMLElement, any>
export type SVG = d3.Selection<SVGSVGElement, undefined, null, undefined>

export interface Margin {
  top: number
  right: number
  bottom: number
  left: number
}

export interface Size extends Margin {
  width: number
  height: number
}

function init_svg(width: number, height: number): SVG {

  // const target = document.querySelector('#target') ? d3.select('#target') : d3.select('body')

  const svg = d3.create('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', width)
    .attr('height', height)

  svg.append('defs').html(pattern)

  // target.append(svg)

  return svg

}

export interface Graph {
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

function translate(dx: number, dy: number) {
  return `translate(${dx}, ${dy})`
}

function round(i: number, snap=1) {
  return Math.round(i / snap) * snap
}


const default_options = {
  inner_facet: 'cell' as CT,
  outer_facet: 'tumor' as CT,
  color_by: 'cell' as CT,
  legend: true,
  p: 0.5,
  w: 40,
  height: 200,
  horizontal: false,
}

export function bar(rows: Row[], options?: Partial<typeof default_options>): Graph {

  const {inner_facet, outer_facet, color_by, legend, p, w, height, horizontal} = {...default_options, ...options}

  const margin = {top: 25, right: legend ? 80 : 10, bottom: 30, left: 30}

  if (horizontal) {
    margin.left += 45
  }

  const outer_range = uniq(rows.map(row => row[outer_facet]))
  const inner_range = uniq(rows.map(row => row[inner_facet]))
  const color_range = uniq(rows.map(row => row[color_by]))

  // TODO: figure out the relationship between these constants to the padding constants
  const width =
    p * w * outer_range.length +
    w * outer_range.length * inner_range.length +
    margin.left + margin.right

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

  const vert_range: [number, number] = [height - margin.bottom, margin.top]
  const horiz_range: [number, number] = [margin.left, width - margin.right]

  const key_outer = d3.scaleBand()
      .domain(outer_range)
      .range(horizontal ? vert_range : horiz_range)
      .padding(0.0)

  const key_inner = d3.scaleBand()
      .domain(inner_range)
      .range([0, key_outer.bandwidth()])
      .paddingInner(0.0)
      .paddingOuter(p)

  const key = d3.scaleBand()
      .domain(range.location)
      .range([0, key_inner.bandwidth()])
      .paddingInner(0.0)
      .paddingOuter(0.15)

  const value = d3.scaleLinear()
      .domain([0, d3.max(rows, row => row.expression) || 0]).nice()
      .range(horizontal ? horiz_range : vert_range)

  interface Base {
    x: number
    width: number
    y: number
    y2: number
  }

  interface Rect {
    x: number
    width: number
    y: number
    height: number
  }

  const fixup = (base: Base): Rect => {
    const next: Base | Rect = {
      ...base,
      height: Math.abs(base.y - base.y2),
      y: Math.min(base.y, base.y2),
    }
    if (horizontal) {
      return {
        y: next.x,
        height: next.width,
        x: next.y,
        width: next.height,
      }
    } else {
      return next
    }
  }

  const coords = (row: Row) => fixup({
    x: round(key_outer(row[outer_facet]) + key_inner(row[inner_facet])) + round(key(row.location)),
    width: round(key.bandwidth()),
    y: round(value(0)),
    y2: round(value(row.expression)),
  })

  const coorded_rows = rows.map(r => ({...r, ...coords(r)}))

  svg.append('g')
    .selectAll('rect')
    .data(coorded_rows)
    .join('rect')
      .attr('x', row => row.x)
      .attr('width', row => row.width)
      .attr('y', row => row.y)
      .attr('height', row => row.height)
      .attr('fill', row => z(row[color_by]))
      .filter(row => row.location == 'TUMOR')
      .clone()
      .attr('fill', 'url(#stripe)')

  svg.append('g')
      .attr('transform', translate(0, height - margin.bottom))
      .call(d3.axisBottom(horizontal ? value : key_outer).tickFormat(pretty).tickSizeOuter(0).ticks(8))
      .selectAll(horizontal ? '.domain' : '.tick>line').remove()

  svg.append('g')
      .attr('transform', translate(margin.left, 0))
      .call(d3.axisLeft(horizontal ? key_outer : value).tickFormat(pretty).tickSizeOuter(0).ticks(8))
      .selectAll(horizontal ? '.tick>line' : '.domain').remove()

  return graph(svg, {width, height, ...margin})

}

export function forest(rows: Row[], group_by: CT, color_by = 'cell' as CT): Graph {

  const margin = {top: 25, right: 10, bottom: 30, left: 75}

  const width = 200
  const height = 30 * range[group_by].length + margin.top + margin.bottom

  const svg = init_svg(width, height)

  const z = d3.scaleOrdinal((d3 as any).schemeTableau10 as string[])
    .domain(range[color_by])

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
      .domain([0, Math.min(3, d3.max(rows, row => row.upper) || 0)]).nice()
      .range([margin.left, width - margin.right])

  svg.append('g')
      .attr('transform', translate(0, height - margin.bottom))
      .call(d3.axisBottom(x).ticks(4))

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

function clear(e: Element) {
  while (e.lastElementChild) {
    e.removeChild(e.lastElementChild)
  }
}

export function Graph(props: {graph: Graph | undefined}) {
  const [el, set_el] = React.useState(null as null | Element)
  if (el) {
    clear(el)
    if (props.graph) {
      const node = props.graph.svg.node()
      node && el.append(node)
    }
  }
  return <div ref={set_el}></div>
}

