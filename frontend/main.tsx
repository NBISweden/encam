declare const module: {hot?: {accept: Function}}
module.hot && module.hot.accept()

import * as React from 'react'
import * as ReactDOM from 'react-dom'

import {CT, Row, range, pretty, db, filter, pick_cells, make_gen} from './db'

import {Store} from 'reactive-lens'

import {css, div, clear as clear_css} from './css'
clear_css()

import {plot, cell_color} from './domplots'
import * as domplots from './domplots'
domplots.setup_css()

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

css`
  label {
    cursor: pointer
    padding-top: 5px
    padding-bottom: 5px
  }
  svg {
    display: block
  }
  * {
    user-select: none
  }
  html {
    box-sizing: border-box
    overflow-y: scroll
  }
  *, *:before, *:after {
    box-sizing: inherit
  }
  html, body, #root {
    min-height: 100%
    width: min-content
    min-width: 100%
  }
  body {
    margin: 0
    font-family: sans-serif, sans
  }
  .row {
    display: flex
    flex-direction: row
  }
  .column {
    display: flex
    flex-direction: column
  }
  #root {
    background: #eee
  }
  #top {
    margin: 8 auto
    background: #fff
  }
  #left-sidebar {
    width: 200px
    padding: 0 1em
  }
  #center {
    width: 750px
    border-right: 8px #eee solid
    border-left: 8px #eee solid
  }
  #right-sidebar {
    width: 200px
  }
  h2 {
    margin-top: 1em
    margin-bottom: 0.8em
    margin-left: 0.2em
    font-size: 1.1em
  }
  #sidebar {
  }
  #root {
    display: flex
    flex-direction: row
  }
`

function Checkboxes(range: string[], store: Store<Record<string, boolean>>, on: () => void, color: (s: string) => string = () => 'black') {
  return range.map(x =>
    <label key={x}>
      <input style={{display:'none'}} type="checkbox" checked={!!store.get()[x]} onChange={e => {
        store.transaction(() => {
          const next = selected({...store.get(), [x]: e.target.checked})
          store.set(Object.fromEntries(next.map(k => [k, true])))
          on()
        })}}/>
      <span className={"checkbox " + css`display: inline-block`.className} style={
          {
            borderRadius: '100px',
            border: `2px ${color(x)} solid`,
            background: store.get()[x] ? color(x) : 'none',
            // background: color(x),
            width: '12px',
            height: '12px',
            // marginRight: '8px',
            // display: 'inline-block',
          }
        }></span>
      <span className={"text " + css`margin-left: 8`.className}>{pretty(x)}</span>
    </label>
  )
}

declare const require: (s: string) => string

const body = require('./img/bodies.png')

const cell_pngs: Record<string, string> = {
  B_cells:      require('./img/B_cells.png'),
  CD4:          require('./img/CD4.png'),
  CD4_Treg:     require('./img/CD4_Treg.png'),
  CD8:          require('./img/CD8.png'),
  CD8_Treg:     require('./img/CD8_Treg.png'),
  M1:           require('./img/M1.png'),
  M2:           require('./img/M2.png'),
  NK:           require('./img/NK.png'),
  NKT:          require('./img/NKT.png'),
  mDC:          require('./img/mDC.png'),
  pDC:          require('./img/pDC.png'),
  iDC:          require('./img/iDC.png'),

  'Myeloid cell': require('./img/Myeloid.png'),
  Granulocyte: require('./img/Granulocytes.png'),
}


function Center() {
  const [paths, set_paths] = React.useState('')

  const tumor_labels =
    Checkboxes(range.tumor, store.at('tumor'), () => store.at('cell').set({}), () => '#444')
     .map(
       (label, i) => {
         const tumor = range.tumor[i]
         const T = 6
         const left_side = i <= T
         const plot_height = 70
         const plot_sep = 130
         const margin = 110
         const style: React.CSSProperties = {position: 'absolute'}
         if (left_side) {
           style.left = margin
           style.top = (i + 0.5) * plot_sep
         } else {
           style.right = margin
           style.top = (i - T) * plot_sep
         }
         const plot_style: React.CSSProperties = {position: 'absolute', bottom: -1}
         plot_style[left_side ? 'right' : 'left'] = '100%'
         const anchor_style: React.CSSProperties = {position: 'absolute', bottom: 0, width: 0, height: 0}
         anchor_style[left_side ? 'right' : 'left'] = 0
         return div(
           {key: i},
           {style},
           {style: {width: 140}},
           css`border-bottom: 1px #666 solid`,
           css`display: flex`,
           left_side || css`justify-content: flex-end`,
           css`& > label { padding: 0 8; }`,
           label,
           tumor == 'BLCA' && <img src={require('./img/bladder.png')}/>,
           tumor == 'BRCA' && <img src={require('./img/breast.png')}/>,
           tumor == 'MEL' && <img src={require('./img/skin.png')}/>,
           div(
             {'data-anchor': tumor},
             {style: anchor_style},
           ),
           div(
             css`position: relative`,
             div(css`
               border-bottom: 1px #666 solid
               position: absolute
               width: 100%
               bottom: 0
               left: 0
               z-index: 3
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
               )))
         })

  return div(
    {
      id: 'center',
      style: {
        position: 'relative',
      },
      ref(e: HTMLElement | null) {
        if (e) {
          const center_rect = {
            x: e.getBoundingClientRect().left + e.clientLeft,
            y: e.getBoundingClientRect().top + e.clientTop,
          }
          const anchors = {} as Record<string, {x: number, y: number}>
          e.querySelectorAll('[data-anchor]').forEach(a => {
            if (a instanceof HTMLElement) {
              const k = a.dataset.anchor
              if (k) {
                const rect = a.getBoundingClientRect()
                anchors[k] = {
                  x: rect.x - center_rect.x,
                  y: rect.y - center_rect.y,
                }
              }
            }
          })
          const body = anchors.body
          let next = ''
          const g = make_gen()
          Object.entries(anchors).forEach(([k, v]) => {
            if (k != 'body') {
              const dest = {...body}
              dest.x += 85
              dest.y += 200
              dest.x -= (v.x - dest.x) * -0.11
              dest.y -= (v.y - dest.y) * -0.21
              dest.x += g.next() % 10
              dest.y += g.next() % 3
              const c1 = {...v}
              const c2 = {...dest}
              let d = 50
              if (v.x > dest.x) {
                d *= -1
              }
              c1.x += d
              c2.x -= d
              // next += `M${v.x} ${v.y} L${dest.x} ${dest.y} `
              next += `M${v.x} ${v.y + 0.6} C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${dest.x} ${dest.y} `
            }
          })
          if (next != paths) {
            set_paths(next)
          }
        }
      }
    },
    <img src={body} data-anchor="body" style={{
      width: '24%',
      position: 'absolute',
      left: '39%',
      top: '40px',
    }}/>,
    ...tumor_labels,
    <svg width="100%"
         height="100%"
         style={{position: 'absolute', pointerEvents: 'none'}}>
      <path d={paths} stroke="black" fill="none"/>
    </svg>
  )
}

import ColorThief from 'colorthief'
const colorThief = new ColorThief()

const i = range.cell.findIndex(c => c == 'iDC_single')
i == -1 || range.cell.splice(i, 1)


function Root() {
  return (
    <div id="top" className="row">
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
            cell_color
          ).map((x, i) => {
              const cell = range.cell[i]
              const cell_png = cell_pngs[range.cell[i]]
              const thief = (e: HTMLImageElement) => {
                if (e && e.complete) {
                  const nice = (rgb: [number, number, number], i: number) => {
                    const [r,g,b] = rgb
                    const dist = Math.max(...rgb) - Math.min(...rgb)
                    const avg = (r+g+b) / 3
                    console.log(`%c  %c ${cell} ${dist} ${avg} ${rgb.join(', ')}`, `background:rgb(${rgb.join(',')})`, `background: unset`)
                    return dist > 20 && avg < 210 && (cell != 'iDC' || i > 2) && (cell != 'CD4' || i > 0)
                  }
                  const p = colorThief.getPalette(e).filter(nice)
                  if (domplots.set_cell_color(cell, `rgb(${p[0].join(',')})`)) {
                    store.set(store.get())
                  }
                }
              }
              const img = cell_png && <img src={cell_png} onLoad={e => thief(e.target as any)} ref={thief}/>
              return <label>{div(
                css`
                  display: flex
                  flex-direction: row
                  // justify-content: space-between
                  border: 1.5px #ddd solid
                  border-radius: 2px
                `,
                css`& > * {
                  margin: auto 0;
                  padding: 5px;
                  flex: 1;
                }`,
                div(x, css`& .text { display: none }`, css`flex: 0`),
                div(
                  // {style: {flex: 0.7}},
                  css`display: flex;`,
                  css`& > * { margin: auto; flex-grow: 0; }`,
                  img
                ),
                div(
                  x,
                  css`& .checkbox { display: none; }`,
                  css`& .text { margin-left: 0 }`,
                  css`font-size: 0.8em`),
              )
            }</label>})}
      </div>
      <Center/>
      {div(
        {
          id: 'right-sidebar',
          className: 'column',
        },
        css`& > div { margin: 10px auto }`,
        right_sidebar()
      )}
    </div>
  )
}

function selected(d: Record<string, boolean>): string[] {
  return Object.entries(d).filter(([_, v]) => v).map(([k, _]) => k)
}

function right_sidebar(): React.ReactNode[] {
  const out: React.ReactNode[] = []

  const {tumor, cell} = store.get()
  const tumors = selected(tumor)
  const cells  = selected(cell)
  const opts   = {orientation: 'portrait' as 'portrait', axis_right: true}
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
  store.transaction(() => {
    ReactDOM.render(Root(), document.querySelector('#root'))
    // ReactDOM.render(<Demo/>, document.querySelector('#root'))
  })
}

// window.requestAnimationFrame(redraw)
redraw()

store.on(redraw)
store.on(x => console.log(JSON.stringify(x)))

