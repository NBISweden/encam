/**

  These plots are used on the splash page and use only DOM components.
  Vega plots cannot be used here because they are too slow. (sigh)
  DOM was preferred over canvas to get zoomable vector graphics.

*/
import * as React from 'react'

import {div, css} from './ui_utils'

import * as utils from './utils'

import {SplashDB, SplashRow} from './splash_db'

import {cell_color} from './cell_colors'

import {DomplotCSS} from './DomplotCSS'

export {DomplotCSS} from './DomplotCSS'

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
    undefined as
      | undefined
      | {
          width: number
          height: number
          left: number
          top: number
        }
  )
  const dim: undefined | React.CSSProperties = size && {
    width: size.width,
    height: size.height,
    position: 'relative',
  }
  const offset: undefined | React.CSSProperties = size && {
    left: size.left,
    top: size.top,
    position: 'absolute',
  }
  const update_size = (outer: Rect, inner: Rect) => {
    const new_size = {
      width: outer.width,
      height: outer.height,
      left: inner.left - outer.left,
      top: inner.top - outer.top,
    }
    const normalize = (x: typeof size) => utils.str(x && utils.mapObject(x, v => Math.round(v)))
    if (normalize(size) != normalize(new_size)) {
      set_size(new_size)
    }
  }
  return (
    <div style={dim}>
      <div
        style={offset}
        ref={e => {
          if (e) {
            const ch = e.firstChild
            if (ch && ch instanceof Element) {
              update_size(hull(ch), ch.getBoundingClientRect())
            }
          }
        }}>
        {props.component}
      </div>
    </div>
  )
}

const hulled = (component: React.ReactElement) => <Hulled component={component} />

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

  border_left: false,

  x: 'location' as keyof SplashRow,
  facet_x: 'cell' as keyof SplashRow,
  color: 'cell' as keyof SplashRow,
  striped: 'STROMA',
}

export function Domplot({
  rows,
  kind,
  options,
}: {
  rows: SplashRow[]
  kind: 'bar' | 'forest'
  options?: Partial<typeof default_options>
}) {
  const opts = {...default_options, ...options}
  const landscape = opts.orientation == 'landscape'

  const max = kind == 'bar' ? opts.max || Math.max(...rows.map(row => row.expression)) : 3
  const p = (x: number) => x * 100 + '%'
  const o = landscape
    ? {
        width: 'width',
        height: 'height',
        left: 'left',
        bottom: 'bottom',
        right: 'right',
        top: 'top',
      }
    : {
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
    // console.log(opts.facet_x, facet_x)
    const marks: React.ReactElement[] = []
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
        width: number | string
        height: number | string
        bottom?: number | string
        striped?: boolean
        arrow?: number
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
        const arrowBorders: React.CSSProperties = m.arrow
          ? {
              borderWidth:
                // top right bottom left
                landscape
                  ? `0px ${half}px ${half}px ${half}px`
                  : `${half}px 0px ${half}px ${half}px`,
              borderColor: landscape
                ? `transparent transparent ${color} transparent`
                : `transparent transparent transparent ${color}`,
              borderStyle: 'solid',
              backgroundColor: undefined,
              [o.left]: left(m.arrow),
            }
          : {}
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
              ...arrowBorders,
            }}
            className={m.striped ? 'striped' : undefined}
          />
        )
      }
      if (kind == 'forest') {
        const upper = Math.min(row.upper, max)
        const height = upper - row.lower
        row.lower < max &&
          mark({
            height: `calc(${p(height / max)} + 0.5px)`,
            width: 2,
            bottom: p(row.lower / max),
            striped,
          })
        row.coef < max &&
          mark({
            height: 1,
            width: 6,
            bottom: p(row.coef / max),
          })
        row.lower < max &&
          mark({
            height: 1,
            width: 4,
            bottom: p(row.lower / max),
          })
        upper < max &&
          mark({
            height: 1,
            width: 4,
            bottom: p(upper / max),
          })
        upper >= max &&
          mark({
            height: 0,
            width: 0,
            bottom: `calc(${p(upper / max)} - 2px)`,
            arrow: 8,
          })
      } else {
        const height = row.expression / max
        height >= 1 / opts.height &&
          mark({
            height: p(height),
            width: p(full_width),
            striped,
          })
      }
      return marks
    })
    facet_index > 0 &&
      // separator
      bars.push(
        <div
          key={bars.length}
          style={{
            [o.width]: opts.gap_width,
          }}
        />
      )
    bars.push(
      <div
        key={bars.length}
        style={{
          [o.width]: opts.bar_width * rng.length,
          [o.height]: p(1),
          position: 'relative',
        }}>
        {marks}
        {opts.x_axis && (
          <div
            style={{
              position: 'absolute',
              [o.top]: landscape ? p(1) : p(1.05),
              [o.left]: landscape ? `calc(${p(0.5)} - 3px)` : undefined,
              fontSize: 10,
              transform: landscape
                ? 'translate(-50%, -50%) rotate(-45deg) translate(-50%, 50%)'
                : undefined,
              whiteSpace: 'nowrap',
            }}>
            {utils.pretty(facet_x)}
          </div>
        )}
      </div>
    )
  })

  const axis_label: React.CSSProperties = {
    transform: opts.axis_right
      ? landscape
        ? 'translate(6px, -55%)'
        : 'translate(-50%, 10%)'
      : landscape
      ? 'translate(-6px, -55%)'
      : 'translate(-50%, -110%)',
    position: 'absolute',
    fontSize: 11,
  }
  if (landscape) {
    axis_label[opts.axis_right ? 'left' : 'right'] = 0
  }

  const y_axis_line = (
    <div
      key={bars.length}
      style={{
        [o.width]: 1,
        background: '#888',
      }}
    />
  )
  if (opts.axis_right) {
    bars.push(y_axis_line)
  } else {
    bars.unshift(y_axis_line)
  }

  const tick_step = utils.roundDown(max / (opts.num_ticks - 1))
  const ticks = utils
    .enumTo(opts.num_ticks)
    .map(x => x * tick_step)
    .map(x => (
      <div
        key={x}
        style={{
          [opts.axis_right ? o.left : o.right]: p(1),
          [o.bottom]: p(x / max),
          position: 'absolute',
          background: '#888',
          [o.height]: 1,
          [o.width]: 4,
        }}>
        <div style={axis_label}>{x}</div>
      </div>
    ))

  return (opts.hulled ? hulled : utils.identity)(
    <div
      style={{
        [o.height]: opts.height,
        display: 'inline-flex',
        flexDirection: landscape ? 'row' : 'column',
        position: 'relative',
      }}>
      {ticks}
      {kind == 'forest' && (
        <div
          key="one"
          style={{
            [o.left]: 0,
            [o.bottom]: p(1 / max),
            position: 'absolute',
            border: '0.5px #ddd solid',
            [o.width]: p(1),
            zIndex: 1,
          }}
        />
      )}
      {bars}
      {opts.border_left && (
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            left: 0,
            top: 0,
            borderLeft: '1px #888 solid',
            zIndex: 2,
          }}
        />
      )}
    </div>
  )
}

function wrap3<
  R extends Record<string, any>,
  K1 extends keyof R,
  K2 extends keyof R,
  K3 extends keyof R,
  T
>(f: (r: R) => T, k1: K1, k2: K2, k3: K3) {
  return (x1: R[K1], x2: R[K2], x3: R[K3]) => f({[k1]: x1, [k2]: x2, [k3]: x3} as any)
}

import * as backend from './backend'

export function DomplotsDemo() {
  const db = backend.useRequest<SplashDB>('database')
  const CD4s = db && db.filter(row => row.cell == 'CD4')
  const MELs = db && db.filter(row => row.tumor == 'MEL')
  const plot = wrap3(Domplot, 'rows', 'kind', 'options')
  return !CD4s || !MELs
    ? null
    : div(
        <DomplotCSS />,
        css`
          width: 900;
          margin: 10 auto;
          background: white;
          & > div {
            display: inline-block;
            margin: 30px;
          }
        `,
        plot(CD4s, 'bar', {facet_x: 'tumor'}),
        plot(CD4s, 'forest', {facet_x: 'tumor'}),
        plot(MELs, 'bar', {facet_x: 'location', x: 'cell', bar_width: 2, gap_width: 18}),
        plot(MELs, 'forest', {facet_x: 'location', x: 'cell', bar_width: 8, gap_width: 18}),
        plot(MELs, 'bar', {}),
        plot(MELs, 'bar', {axis_right: true}),
        plot(MELs, 'bar', {orientation: 'portrait'}),
        plot(MELs, 'bar', {axis_right: true, orientation: 'portrait'}),
        plot(MELs, 'forest', {}),
        plot(MELs, 'forest', {axis_right: true}),
        plot(MELs, 'forest', {orientation: 'portrait'}),
        plot(MELs, 'forest', {axis_right: true, orientation: 'portrait'})
      )
}

export function Legend() {
  return (
    <>
      <DomplotCSS />
      <div>
        <div
          style={{
            width: '8px',
            height: '8px',
            marginRight: '4px',
            backgroundColor: '#ccc',
            display: 'inline-block',
          }}
        />
        <span>TUMOR</span>
      </div>
      <div>
        <div
          className="striped"
          style={{
            width: '8px',
            height: '8px',
            marginRight: '4px',
            backgroundColor: '#ccc',
            display: 'inline-block',
          }}
        />
        <span>STROMA</span>
      </div>
    </>
  )
}

import stories from '@app/ui_utils/stories'
import * as splash_data from './data/splash'

stories(add => {
  add(<DomplotsDemo />)
  add(<DomplotsDemo />)
    .wrap(backend.mock(splash_data.request))
    .tag('mock')
    .snap()
})
