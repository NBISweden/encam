import * as React from 'react'
import * as stripes from './stripes'

import {div, css} from './css'

import * as utils from './utils'

import {DB, Row} from './db'

import styled, * as sc from 'styled-components'

import {cell_color} from './cell_colors'

export const DomplotCSS = sc.createGlobalStyle`
  .striped {
    background-image: url('data:image/svg+xml;base64,${btoa(stripes.patternSVG)}')
  }
`

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
    const normalize = (x: typeof size) => JSON.stringify(x && utils.mapObject(x, v => Math.round(v)))
    if (normalize(size) != normalize(new_size)) {
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

const default_options = {
  bar_width: 8,
  gap_width: 5,
  num_ticks: 4,
  height: 100,
  axis_right: false,
  orientation: 'landscape' as 'landscape' | 'portrait',
  x_axis: true,

  max: undefined as undefined | number,

  hulled: true,

  x: 'location' as keyof Row,
  facet_x: 'cell' as keyof Row,
  color: 'cell' as keyof Row,
  striped: 'STROMA',
}

export function Domplot({rows, kind, options}: {rows: Row[], kind: 'bar' | 'forest', options?: Partial<typeof default_options>}) {
  const opts = {...default_options, ...options}
  const landscape = opts.orientation == 'landscape'

  const max = kind == 'bar' ? (opts.max || Math.max(...rows.map(row => row.expression))) : 3
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
  const facet_range = Object.entries(utils.groupBy(opts.facet_x, rows))
  const range = utils.row_range(rows)
  facet_range.forEach(([facet_x, subrows], facet_index) => {

    const marks: React.ReactElement[]  = []
    const grouped = utils.groupBy(opts.x, subrows)
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
        const height = row.expression / max
        height >= (1 / opts.height) && mark({
          height: p(height),
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
        {opts.x_axis && <div style={{
            position: 'absolute',
            [o.top]: landscape ? p(1) : p(1.05),
            [o.left]: landscape ? `calc(${p(0.5)} - 3px)` : undefined,
            fontSize: 10,
            transform: landscape ? 'translate(-50%, -50%) rotate(-45deg) translate(-50%, 50%)' : undefined,
            whiteSpace: 'nowrap',
          }}>
          {utils.pretty(facet_x)}
        </div>}
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

  const tick_step = utils.roundDown(max / (opts.num_ticks - 1))
  const ticks = utils.enumTo(opts.num_ticks)
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

  return (opts.hulled ? hulled : utils.identity)(
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

function wrap3
  <R extends Record<string, any>, K1 extends keyof R, K2 extends keyof R, K3 extends keyof R, T>
  (f: (r: R) => T, k1: K1, k2: K2, k3: K3)
{
  return (x1: R[K1], x2: R[K2], x3: R[K3]) => f({[k1]: x1, [k2]: x2, [k3]: x3} as any)
}

import {backend} from './backend'

export function Demo(props: {backend?: typeof backend}) {
  const the_backend = props.backend || backend
  const db = the_backend.useRequest('database') as undefined | DB
  const sep = div(css`height: 100`)
  const plot = wrap3(Domplot, 'rows', 'kind', 'options')
  return div(
    <DomplotCSS/>,
    css`width: 900; margin: 10 auto; background: white;`,
    css`& > div { display: inline-block; margin: 30px; }`,
    db && plot(db.filter(row => row.cell == 'CD4'), 'bar', {facet_x: 'tumor'}), sep,
    db && plot(db.filter(row => row.cell == 'CD4'), 'forest', {facet_x: 'tumor'}), sep,
    db && plot(db.filter(row => row.tumor == 'MEL'), 'bar', {facet_x: 'location', x: 'cell', bar_width: 2, gap_width: 18}), sep,
    db && plot(db.filter(row => row.tumor == 'MEL'), 'forest', {facet_x: 'location', x: 'cell', bar_width: 8, gap_width: 18}), sep,
    db && plot(db.filter(row => row.tumor == 'MEL'), 'bar', {}), sep,
    db && plot(db.filter(row => row.tumor == 'MEL'), 'bar', {axis_right: true, }), sep,
    db && plot(db.filter(row => row.tumor == 'MEL'), 'bar', {orientation: 'portrait'}), sep,
    db && plot(db.filter(row => row.tumor == 'MEL'), 'bar', {axis_right: true, orientation: 'portrait'}), sep,
    db && plot(db.filter(row => row.tumor == 'MEL'), 'forest', {}), sep,
    db && plot(db.filter(row => row.tumor == 'MEL'), 'forest', {axis_right: true, }), sep,
    db && plot(db.filter(row => row.tumor == 'MEL'), 'forest', {orientation: 'portrait'}), sep,
    db && plot(db.filter(row => row.tumor == 'MEL'), 'forest', {axis_right: true, orientation: 'portrait'}), sep,
  )
}

