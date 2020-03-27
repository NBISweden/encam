import * as d3 from 'd3'

import * as React from 'react'
import * as stripes from './stripes'

import {css, Div, div, clear as clear_css} from './css'

// import * as plots from './plots'

import {CT, Row, range, pretty, db, filter, pick_cells} from './db'

export const cell_color = d3.scaleOrdinal((d3 as any).schemeTableau10 as string[])
    .domain(range.cell)

interface Rect {
  width: number
  height: number
  left: number
  right: number
  top: number
  bottom: number
}

function hull(e: Element): Rect {
  const rect = e.getBoundingClientRect()
  const res: Rect = {
    width: rect.width,
    height: rect.height,
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom,
  }
  Array.from(e.children).forEach(child => {
    const box = hull(child)
    res.left = Math.min(res.left, box.left)
    res.right = Math.max(res.right, box.right)
    res.top = Math.min(res.top, box.top)
    res.bottom = Math.max(res.bottom, box.bottom)
  })
  res.width = res.right - res.left
  res.height = res.bottom - res.top
  return res
}

function Hulled(props: {component: React.ReactElement}): React.ReactElement {
  let [size, set_size] = React.useState(
    undefined as undefined | {
       width: number,
       height: number,
       left: number,
       top: number,
    })
  const dim: undefined | React.CSSProperties = size && {
    width: size.width, height: size.height, position: 'relative'
  }
  const offset: undefined | React.CSSProperties = size && {
    left: size.left, top: size.top, position: 'absolute'
  }
  const update_size = (outer: Rect, inner: Rect) => {
    const new_size = {
      width: outer.width,
      height: outer.height,
      left: inner.left - outer.left,
      top: inner.top - outer.top,
    }
    if (JSON.stringify(size) != JSON.stringify(new_size)) {
      set_size(new_size)
    }
  }
  return (
    <div style={dim}>
      <div style={offset} ref={e => {
        if (e) {
          const ch = e.firstChild
          if (ch && ch instanceof Element) {
            update_size(hull(ch), ch.getBoundingClientRect())
          }
        }
      }}>{props.component}</div></div>
  )
}

const hulled = (component: React.ReactElement) => <Hulled component={component}/>

function roundDown(x: number): number {
  // Rounds down to one digit precision
  // roundDown(999) => 900
  // roundDown(0.123) => 0.1
  const d = Math.pow(10, Math.floor(Math.log10(x)))
  return Math.floor(x / d) * d
}

function enumTo(elements: number): number[] {
  const out: number[] = []
  for (let i = 0; i < elements; ++i) {
    out.push(i)
  }
  return out
}

const default_options = {
  bar_width: 8,
  gap_width: 5,
  num_ticks: 4,
  height: 100,
  axis_right: false,
  orientation: 'landscape' as 'landscape' | 'portrait',

  hulled: true,

  x: 'location' as keyof Row,
  facet_x: 'cell' as keyof Row,
  color: 'cell' as keyof Row,
  striped: 'STROMA',
}

function groupBy<T extends Record<string, any>>(k: keyof T, rows: T[]): Record<string, T[]> {
  const res: Record<string, T[]> = {}
  rows.forEach(row => {
    const v = row[k]
    res[v] = res[v] || []
    res[v].push(row)
  })
  return res
}

function identity<A>(a: A): A {
  return a
}

export function plot(rows: Row[], kind: 'bar' | 'forest', options?: Partial<typeof default_options>) {
  const opts = {...default_options, ...options}
  const landscape = opts.orientation == 'landscape'

  const max = kind == 'bar' ? Math.max(...range.expression) : 3
  const p = (x: number) => (x * 100) + '%'
  const o = landscape ? {
    width: 'width',
    height: 'height',
    left: 'left',
    bottom: 'bottom',
    right: 'right',
    top: 'top',
  } : {
    width: 'height',
    height: 'width',
    left: 'top',
    bottom: 'left',
    right: 'bottom',
    top: 'right',
  }

  const bars: React.ReactElement[] = []
  const facet_range = Object.entries(groupBy(opts.facet_x, rows))
  facet_range.forEach(([facet_x, subrows], facet_index) => {

    const marks: React.ReactElement[]  = []
    const grouped = groupBy(opts.x, subrows)
    const rng = range[opts.x] as string[]
    rng.forEach((x, i) => {
      const group_rows = grouped[x] || []
      console.assert(group_rows.length <= 1)
      const row = group_rows.length == 1 ? group_rows[0] : undefined
      if (!row) {
        return
      }
      interface Mark {
        width: number | string,
        height: number | string,
        bottom?: number | string,
        striped?: boolean,
        arrow?: number,
      }
      const color = cell_color(row[opts.color] + '')
      const striped = x == opts.striped
      const full_width = 1 / rng.length
      const mark = (m: Mark) => {
        function left(width: number | string) {
          const width_px = typeof width === 'number' ? width + 'px' : width
          return `calc(${p(full_width * i + full_width / 2)} - (${width_px} / 2))`
        }
        const half = (m.arrow || 0) / 2
        // https://css-tricks.com/snippets/css/css-triangle/
        const arrowBorders: React.CSSProperties = m.arrow ? {
          borderWidth:
            // top right bottom left
            landscape
            ? `0px ${half}px ${half}px ${half}px`
            : `${half}px 0px ${half}px ${half}px`,
          borderColor:
            landscape
            ? `transparent transparent ${color} transparent`
            : `transparent transparent transparent ${color}`,
          borderStyle: 'solid',
          backgroundColor: undefined,
          [o.left]: left(m.arrow),
        }: {}
        marks.push(
          <div
            key={marks.length}
            style={{
              [o.width]: m.width,
              [o.left]: left(m.width),
              [o.height]: m.height,
              [o.bottom]: m.bottom || 0,
              position: 'absolute',
              backgroundColor: color,
              zIndex: 2,
              ...arrowBorders
            }}
            className={m.striped ? 'striped' : undefined}
            />)
      }
      if (kind == 'forest') {
        const upper = Math.min(row.upper, max)
        const height = upper - row.lower
        row.lower < max && mark({
          height: `calc(${p(height / max)} + 0.5px)`,
          width: 2,
          bottom: p(row.lower / max),
          striped,
        })
        row.coef < max && mark({
          height: 1,
          width: 6,
          bottom: p(row.coef / max),
        })
        row.lower < max && mark({
          height: 1,
          width: 4,
          bottom: p(row.lower / max),
        })
        upper < max && mark({
          height: 1,
          width: 4,
          bottom: p(upper / max),
        })
        upper >= max && mark({
          height: 0,
          width: 0,
          bottom: `calc(${p(upper / max)} - 2px)`,
          arrow: 8,
        })
      } else {
        mark({
          height: p(row.expression / max),
          width: p(full_width),
          striped,
        })
      }
      return marks
    })
    facet_index == 0 || bars.push(
      <div key={bars.length} style={{[o.width]: opts.gap_width,
        // backgroundColor: '#f3f3f3'
      }}/>
    )
    bars.push(
      <div key={bars.length} style={{
          [o.width]: opts.bar_width * rng.length,
          [o.height]: p(1),
          position: 'relative',
        }}>
        {marks}
        <div style={{
            position: 'absolute',
            [o.top]: landscape ? p(1) : p(1.05),
            [o.left]: landscape ? `calc(${p(0.5)} - 3px)` : undefined,
            fontSize: 10,
            transform: landscape ? 'translate(-50%, -50%) rotate(-45deg) translate(-50%, 50%)' : undefined,
            whiteSpace: 'nowrap',
          }}>
          {pretty(facet_x)}
        </div>
      </div>
    )
  })

  const axis_label: React.CSSProperties = {
    transform:
      opts.axis_right
        ? (landscape ? 'translate(6px, -55%)' : 'translate(-50%, 10%)')
        : (landscape ? 'translate(-6px, -55%)' : 'translate(-50%, -110%)'),
    position: 'absolute',
    fontSize: 11
  }
  if (landscape) {
    axis_label[opts.axis_right ? 'left' : 'right'] = 0
  }

  const tick_step = roundDown(max / (opts.num_ticks - 1))
  const ticks = enumTo(opts.num_ticks)
    .map(x => x * tick_step)
    .map(x =>
        <div key={x} style={{
            [opts.axis_right ? o.left : o.right]: p(1),
            [o.bottom]: p(x / max),
            position: 'absolute',
            border: '0.5px #888 solid',
            [o.width]: 4
          }}>
          <div style={axis_label}>{x}</div>
        </div>
      )

  return (opts.hulled ? hulled : identity)(
    <div style={{
        [o.height]: opts.height,
        display: 'inline-flex',
        flexDirection: landscape ? 'row' : 'column',
        position: 'relative'
      }}>
      {ticks}
      {kind == 'forest' && <div key="one" style={{
        [o.left]: 0,
        [o.bottom]: p(1 / max),
        position: 'absolute',
        border: '0.5px #ddd solid',
        [o.width]: p(1),
        zIndex: 1,
       }}/>}
       {bars}
    </div>
  )
}

function Demo() {
  const sep = div(css`height: 100`)
  return div(
    css`width: 900; margin: auto; background: white;`,
    css`& > div { display: inline-block; margin: 30px; }`,
    plot(filter('cell', 'CD4'), 'bar', {facet_x: 'tumor'}), sep,
    plot(filter('cell', 'CD4'), 'forest', {facet_x: 'tumor'}), sep,
    plot(filter('tumor', 'lung'), 'bar', {facet_x: 'location', x: 'cell', bar_width: 2, gap_width: 18}), sep,
    plot(filter('tumor', 'lung'), 'forest', {facet_x: 'location', x: 'cell', bar_width: 8, gap_width: 18}), sep,
    plot(filter('tumor', 'lung'), 'bar', {}), sep,
    plot(filter('tumor', 'lung'), 'bar', {axis_right: true, }), sep,
    plot(filter('tumor', 'lung'), 'bar', {orientation: 'portrait'}), sep,
    plot(filter('tumor', 'lung'), 'bar', {axis_right: true, orientation: 'portrait'}), sep,
    plot(filter('tumor', 'lung'), 'forest', {}), sep,
    plot(filter('tumor', 'lung'), 'forest', {axis_right: true, }), sep,
    plot(filter('tumor', 'lung'), 'forest', {orientation: 'portrait'}), sep,
    plot(filter('tumor', 'lung'), 'forest', {axis_right: true, orientation: 'portrait'}), sep,
  )
}

