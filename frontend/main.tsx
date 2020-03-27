declare const module: {hot?: {accept: Function}}
module.hot && module.hot.accept()

import * as React from 'react'
import * as ReactDOM from 'react-dom'

import {css, Div, div, clear as clear_css, container} from './css'

// import * as plots from './plots'

import * as stripes from './stripes'

import {CT, Row, range, pretty, db, filter, pick_cells} from './db'

import {Store} from 'reactive-lens'

import {plot, cell_color} from './domplots'

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
    min-height: 100%;
    width: min-content;
    min-width: 100%;
  }
  body {
    margin: 0;
    font-family: sans-serif, sans;
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
    background-image: url('data:image/svg+xml;base64,${btoa(stripes.patternSVG)}');
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

const body = require('./body.svg')

function Root() {
  const center = container(
    {
      id: 'center',
      style: {
        position: 'relative',
        minHeight: Math.max(...Object.values(offsets).map(off => off.y + 220)),
      },
    },
    <img src={body} style={{
      width: '22%',
      position: 'absolute',
      left: '39%',
      top: '40px',
    }}/>
  )

  Checkboxes(range.tumor, store.at('tumor'), () => store.at('cell').set({}), () => '#444')
    .forEach(
      (label, i) => {
        const tumor = range.tumor[i]
        const T = 5
        const left_side = i <= T
        const style: React.CSSProperties = {position: 'absolute'}
        const plot_height = 70
        const plot_sep = 130
        const margin = 110
        if (left_side) {
          style.left = margin
          style.top = (i + 0.5) * plot_sep
        } else {
          style.right = margin
          style.top = (i - T) * plot_sep
        }
        const plot_style: React.CSSProperties = {position: 'absolute', bottom: -1}
        plot_style[left_side ? 'right' : 'left'] = '100%'
        center.push(div(
          {key: i},
          {style},
          {style: {width: 140}},
          css`border-bottom: 1px #666 solid`,
          css`display: flex`,
          left_side || css`justify-content: flex-end`,
          css`& > label { padding: 0 8; }`,
          label,
          div(
            css`position: relative`,
            div(css`
              border-bottom: 1px #666 solid;
              position: absolute;
              width: 100%;
              bottom: 0;
              left: 0;
              z-index: 3;
            `),
            {style: plot_style},
            Object.values(store.get().cell).filter(Boolean).length == 0 ? null :
              plot(
                db.filter(row => store.get().cell[row.cell] && row.tumor == tumor),
                'bar',
                {
                  axis_right: !left_side,
                  height: plot_height,
                  hulled: false,
                }
              ))))
        })

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
      {center}
      <Div
        id="right-sidebar"
        className="column"
        css="& > div {
          margin: 10px auto;
        }">
        {right_sidebar()}
      </Div>
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
  const opts   = {orientation: 'portrait' as 'portrait'}
  for (const t of tumors) {
    out.push(<h2 style={{margin: '10 auto'}}>{pretty(t)}</h2>)
    out.push(plot(filter('tumor', t), 'bar', opts))
    out.push(plot(filter('tumor', t), 'forest', opts))
  }
  for (const c of cells) {
    out.push(<h2 style={{margin: '10 auto'}}>{pretty(c)}</h2>)
    out.push(plot(filter('cell', c), 'forest', {facet_x: 'tumor', ...opts}))
  }
  return out
}

function redraw() {
  ReactDOM.render(<Root/>, document.querySelector('#root'))
  // ReactDOM.render(<Demo/>, document.querySelector('#root'))
}

// window.requestAnimationFrame(redraw)
redraw()

store.ondiff(redraw)
store.on(x => console.log(JSON.stringify(x)))

