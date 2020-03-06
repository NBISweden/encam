declare const module: {hot?: {accept: Function}}
module.hot && module.hot.accept()

import * as React from 'react'
import * as ReactDOM from 'react-dom'

import * as d3 from 'd3'

import {css, Div, div, clear as clear_css} from './css'

import {Graph, forest, bar} from './plots'

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
  body {
    margin: 0;
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
    width: 100%;
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
  body {
    display: flex;
    flex-direction: row;
    font-family: sans-serif, sans;
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
        <div style={{position: 'relative'}}>
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
                        <Graph graph={
                          bar(
                            db.filter(row => store.get().cell[row.cell] && row.tumor == tumor),
                            {
                              inner_facet: 'tumor',
                              outer_facet: 'cell',
                              color_by: 'cell',
                              legend: false,
                              p: 0.10,
                              w: 40,
                              height: 180,
                            })
                          }/>),
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
  const graphs: Graph[] = []

  const {tumor, cell} = store.get()
  const tumors = selected(tumor)
  const cells  = selected(cell)
  for (const t of tumors) {
    graphs.push(bar(filter('tumor', t), {
      inner_facet: 'tumor',
      outer_facet: 'cell',
      color_by: 'cell',
      legend: false,
      p: 0.10,
      w: 7,
      horizontal: true,
      height: 400,
    }).caption(pretty(t)))
    graphs.push(forest(filter('tumor', t), 'cell').caption(pretty(t)))
  }
  for (const c of cells) {
    // bar(pick_cells(c), {color_by: 'tumor', color_by: 'cell', legend: false, p: 0.2}).caption(pretty(c))
    graphs.push(forest(filter('cell', c), 'tumor').caption(pretty(c)))
  }
  return graphs.map((g, i) => <Graph key={i} graph={g}/>)
}

function Demo() {
  const t = 'type₈'
  return div({id: 'top'}, css`width: 800;`,
    <Graph graph={
      bar(filter('tumor', t), {
        inner_facet: 'tumor',
        outer_facet: 'cell',
        color_by: 'cell',
        legend: false,
        p: 0.10,
        w: 40,
        horizontal: false,
        height: 400,
      }).caption(pretty(t) + ', horizontal: false')
    }/>,
    <Graph graph={
      bar(filter('tumor', t), {
        inner_facet: 'tumor',
        outer_facet: 'cell',
        color_by: 'cell',
        legend: false,
        p: 0.10,
        w: 20,
        horizontal: true,
        height: 400,
      }).caption(pretty(t) + ', horizontal: true')
    }/>)
}

function redraw() {
  ReactDOM.render(<Root/>, document.querySelector('#root'))
  // ReactDOM.render(<Demo/>, document.querySelector('#root'))
}

// window.requestAnimationFrame(redraw)
redraw()

store.ondiff(redraw)
store.on(x => console.log(JSON.stringify(x)))

