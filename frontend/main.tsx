declare const module: {hot?: {accept: Function}}
module.hot && module.hot.accept()

import * as React from 'react'
import * as ReactDOM from 'react-dom'

import * as d3 from 'd3'

import {css, Div, div, clear as clear_css} from './css'

import * as plots from './plots'

import {CT, Row, range, pretty, db, filter, pick_cells} from './db'

import {Store} from 'reactive-lens'

const state0 = {
  tumor: {} as Record<string, boolean>,
  cell: {CD4: true} as Record<string, boolean>,
}

type State = typeof state0

declare global {
  interface Window {
    store: Store<State> | undefined
  }
}

const store: Store<State> = Store.init(window.store ? window.store.get() : state0)

window.store = store

if (!document.querySelector('#root')) {
  const root = document.createElement('div')
  root.id = 'root'
  document.body.appendChild(root)
}

clear_css()
css(`
  label {
    cursor: pointer;
    padding-top: 5px;
    padding-bottom: 5px;
  }
  svg {
    display: block;
  }
  * {
    user-select: none;
  }
  html {
    box-sizing: border-box;
    overflow-y: scroll;
  }
  *, *:before, *:after {
    box-sizing: inherit;
  }
  html, body, #root {
    height: 100%;
  }
  html, body, #root {
    width: 100%;
  }
  body {
    margin: 0;
    font-family: sans-serif, sans;
  }
  div {
    // border: 1px blue solid;
    // padding: 1px;
    // margin: 1px;
  }
  .row {
    display: flex;
    flex-direction: row;
  }
  .column {
    display: flex;
    flex-direction: column;
  }
  #root {
    background: #eee;
  }
  #top {
    margin: 8 auto;
    background: #fff;
  }
  #left-sidebar {
    width: 200px;
    padding-left: 1em;
  }
  #center {
    width: 800px;
    border-right: 8px #eee solid;
    border-left: 8px #eee solid;
  }
  #right-sidebar {
    width: 200px;
  }
  h2 {
    margin-top: 1em;
    margin-bottom: 0.8em;
    margin-left: 0.2em;
    font-size: 1.1em;
  }
  #sidebar {
  }
  #root {
    display: flex;
    flex-direction: row;
  }
  .striped {
    background-image: url('data:image/svg+xml;base64,${btoa(plots.patternSVG)}');
  }
`)

function Checkboxes(range: string[], store: Store<Record<string, boolean>>, on: () => void, color: (s: string) => string = () => 'black') {
  return range.map(x =>
    <label key={x}>
      <input style={{display:'none'}} type="checkbox" checked={!!store.get()[x]} onChange={e => {
        store.transaction(() => {
          const next = selected({...store.get(), [x]: e.target.checked})
          store.set(Object.fromEntries(next.map(k => [k, true])))
          on()
        })}}/>
      <span style={
          {
            borderRadius: '100px',
            border: `2px ${color(x)} solid`,
            background: store.get()[x] ? color(x) : 'none',
            width: '12px',
            height: '12px',
            marginRight: '8px',
            display: 'inline-block',
          }
        }></span>
      {pretty(x)}
    </label>
  )
}

const cell_color = d3.scaleOrdinal((d3 as any).schemeTableau10 as string[])
    .domain(range.cell)

function toggle(kind: CT, what: string) {
  const opp: CT = kind == 'cell' ? 'tumor' : 'cell'
  store.transaction(() => {
    store.at(kind).modify(now => ({...now, [what]: !now[what]}))
    store.at(opp).set({})
  })
}

interface Position {
  x: number,
  y: number
}

const offsets: Record<string, Position> = {}

const T = range.tumor.length

range.tumor.forEach((t, i) => {
  offsets[t] = {
    x: 200 * (i % 3) + 20 * (T - i),
    y: 200 * Math.floor(i / 3) + 40 * (i % 3),
  }
})

function Root() {
  return <div id="top" className="row">
      <div id="left-sidebar" className="column">
        <h2>Cell type</h2>
        {Checkboxes(
            range.cell,
            store.at('cell'),
            () => {
              store.at('tumor').set({})
              const cell_keys = Object.keys(store.get().cell)
              if (cell_keys.length > 3) {
                const x = {...store.get().cell}
                delete x[cell_keys[0]]
                store.at('cell').set(x)
              }
            },
            cell_color)}
      </div>
      <div id="center">
        <div style={{
            position: 'relative',
            minHeight: d3.max(Object.values(offsets), off => off.y + 220)
          }}>
          {Checkboxes(range.tumor, store.at('tumor'), () => store.at('cell').set({}), () => '#444')
            .map(
              (label, i) => {
                const tumor = range.tumor[i]
                const offset = offsets[tumor]
                return div(
                  {key: i},
                  {style: {top: offset.y, left: offset.x}},
                  css`position: absolute; width: 180; height: 200;`,
                  div(
                    {className: 'column'},
                    css`& > * { margin: auto; }`,
                    css`position: absolute; bottom: 0; left: 0; width: 100%;`,
                    div(
                      Object.values(store.get().cell).filter(Boolean).length == 0 ? null :
                        plots.barchart(
                          db.filter(row => store.get().cell[row.cell] && row.tumor == tumor),
                          {
                            facet: 'cell',
                            horizontal: false
                          })),
                    div(
                      css`& > label { border: 2px #444 solid; padding: 3px 8px; }`,
                      label)))})}
        </div>
      </div>
      <div id="right-sidebar" className="column">
        {right_sidebar()}
      </div>
    </div>
}

function selected(d: Record<string, boolean>): string[] {
  return Object.entries(d).filter(([_, v]) => v).map(([k, _]) => k)
}

function right_sidebar(): React.ReactNode[] {
  const out: React.ReactNode[] = []

  const {tumor, cell} = store.get()
  const tumors = selected(tumor)
  const cells  = selected(cell)
  for (const t of tumors) {
    out.push(plots.barchart(filter('tumor', t)))
    out.push(plots.forest(filter('tumor', t)))
  }
  for (const c of cells) {
    // bar(pick_cells(c), {color_by: 'tumor', color_by: 'cell', legend: false, p: 0.2}).caption(pretty(c))
    out.push(plots.forest(filter('cell', c), {facet: 'tumor'}))
  }
  return out
}

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
  let [width, set_width] = React.useState(undefined as undefined | number)
  let [height, set_height] = React.useState(undefined as undefined | number)
  let [left, set_left] = React.useState(undefined as undefined | number)
  let [top, set_top] = React.useState(undefined as undefined | number)
  const wh = {width, height, position: width ? 'relative' as 'relative' : undefined}
  const lt = {left, top, position: left ? 'absolute' as 'absolute' : undefined}
  const set_wh = (outer: Rect, inner: Rect) => {
    set_width(outer.width)
    set_height(outer.height)
    set_left(inner.left - outer.left)
    set_top(inner.top - outer.top)
  }
  return (
    <div style={wh}>
      <div style={lt} ref={e => {
        if (e && !width) {
          const ch = e.firstChild
          if (!ch || !(ch instanceof Element)) return
          set_wh(hull(ch), ch.getBoundingClientRect())
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
  axis_end: false,
  orientation: 'landscape' as 'landscape' | 'portrait',
}

function chart(rows: Row[], kind: 'bar' | 'forest', more_options?: Partial<typeof default_options>) {
  const options = {...default_options, ...more_options}
  const landscape = options.orientation == 'landscape'

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
  range.cell.forEach(cell => {
    const marks: React.ReactElement[]  = []
    range.location.forEach((loc, i) => {
      interface Mark {
        width: number | string,
        height: number | string,
        bottom?: number | string,
        // left?: string,
        striped?: boolean,
        arrow?: number,
      }
      function mark(m: Mark) {
        function left(width: number | string) {
          const width_px = typeof width === 'number' ? width + 'px' : width
          return `calc(${p(0.5 * i + 0.25)} - (${width_px} / 2))`
        }
        const color = cell_color(cell)
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
      let row: Row | undefined
      // TODO: is right now O(n²)
      rows.filter(row => row.cell == cell && row.location == loc).forEach(r => row = r)
      const striped = loc == 'STROMA'
      if (!row) {
        return []
      } else if (kind == 'forest') {
        const upper = Math.min(row.upper, max)
        const height = upper - row.lower
        row.lower < max && mark({
          height: `calc(${p(height / max)} + 0.5px)`,
          width: 2,
          bottom: p(row.lower / max),
          striped,
        })
        mark({
          height: 1,
          width: 6,
          bottom: p(row.coef / max),
        })
        mark({
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
          width: p(0.5),
          striped,
        })
      }
      return marks
    })
    bars.push(
      <div key={bars.length} style={{
          [o.width]: options.bar_width * 2,
          [o.height]: p(1),
          position: 'relative',
        }}>
        {marks}
        <div style={{
            position: 'absolute',
            [o.top]: landscape ? p(1) : p(1.05),
            [o.left]: landscape ? p(0.35) : undefined,
            fontSize: 10,
            transform: landscape ? 'translate(-50%, -50%) rotate(-45deg) translate(-50%, 50%)' : undefined
          }}>
          {cell}
        </div>
      </div>
    )
    bars.push(
      <div key={bars.length} style={{[o.width]: options.gap_width, backgroundColor: '#f3f3f3'}}/>
    )
  })

  const axis_label: React.CSSProperties = {
    transform:
      options.axis_end
        ? (landscape ? 'translate(6px, -55%)' : 'translate(-50%, 10%)')
        : (landscape ? 'translate(-6px, -55%)' : 'translate(-50%, -110%)'),
    position: 'absolute',
    fontSize: 11
  }
  landscape && !options.axis_end && (axis_label.right = 0)
  landscape && options.axis_end && (axis_label.left = 0)

  const tick_step = roundDown(max / (options.num_ticks - 1))
  const ticks = enumTo(options.num_ticks)
    .map(x => x * tick_step)
    .map(x =>
        <div key={x} style={{
            [options.axis_end ? o.left : o.right]: p(1),
            [o.bottom]: p(x / max),
            position: 'absolute',
            border: '0.5px #888 solid',
            [o.width]: 4
          }}>
          <div style={axis_label}>{x}</div>
        </div>
      )

  return (
    <div style={{ [o.height]: 100, display: 'inline-flex', flexDirection: landscape ? 'row' : 'column', position: 'relative'}}>
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
  const t = 'type₈'
  return div(css`width: 900; margin: auto; background: white;`, css`& > div { display: inline-block; margin: 30px; }`,
    hulled(chart(filter('tumor', 'lung'), 'bar', {})),                                           div(css`height: 100`),
    hulled(chart(filter('tumor', 'lung'), 'bar', {axis_end: true, })),                           div(css`height: 100`),
    hulled(chart(filter('tumor', 'lung'), 'bar', {orientation: 'portrait'})),                    div(css`height: 100`),
    hulled(chart(filter('tumor', 'lung'), 'bar', {axis_end: true, orientation: 'portrait'})),    div(css`height: 100`),
    hulled(chart(filter('tumor', 'lung'), 'forest', {})),                                        div(css`height: 100`),
    hulled(chart(filter('tumor', 'lung'), 'forest', {axis_end: true, })),                        div(css`height: 100`),
    hulled(chart(filter('tumor', 'lung'), 'forest', {orientation: 'portrait'})),                 div(css`height: 100`),
    hulled(chart(filter('tumor', 'lung'), 'forest', {axis_end: true, orientation: 'portrait'})), div(css`height: 100`),
  )
}

function redraw() {
  // ReactDOM.render(<Root/>, document.querySelector('#root'))
  ReactDOM.render(<Demo/>, document.querySelector('#root'))
}

// window.requestAnimationFrame(redraw)
redraw()

store.ondiff(redraw)
store.on(x => console.log(JSON.stringify(x)))

