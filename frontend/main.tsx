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
  return range.map(x => {
    const checked = store.get()[x]
    const onClick = () => {
      store.transaction(() => {
        const next = selected({...store.get(), [x]: !checked})
        store.set(Object.fromEntries(next.map(k => [k, true])))
        on()
      })
    }
    return {
      text: x,
      onClick,
      label: <span className={"text " + css`margin-left: 8`.className}>{pretty(x)}</span>,
      checkbox:
        <span
          className={"checkbox " + css`display: inline-block`.className}
          onClick={onClick}
          style={{
            borderRadius: '100px',
            border: `2px ${color(x)} solid`,
            background: store.get()[x] ? color(x) : 'none',
            // background: color(x),
            width: '12px',
            height: '12px',
            // marginRight: '8px',
            // display: 'inline-block',
          }}
          />,
    }
  })
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

const codes = require('./codes.json') as Record<string, string>

const left = 'MEL LUAD LUSC ESCA STAD KRCC BLCA PRAD'.split(' ')
const right = 'BRCA PPADpb PPADi COAD READ OVSA OVNSA UCEC'.split(' ')
const both = [...left, ...right]
both.forEach(b => b in codes || console.error(b, 'not in', codes))

function Center() {
  const [hover, set_hover] = React.useState('hover')
  const tumor_labels =
    Checkboxes(both, store.at('tumor'), () => store.at('cell').set({}), () => '#444')
    .map(
      (x, i) => {
        const tumor = x.text // range.tumor[i]
        const T = 8
        const left_side = i < T
        const plot_height = 66
        const plot_sep = 77
        const margin = 90
        const top_off = 60
        const style: React.CSSProperties = {position: 'absolute'}
        if (left_side) {
          style.left = margin
          style.top = top_off + (i) * plot_sep
        } else {
          style.right = margin
          style.top = top_off + (i - T) * plot_sep
        }
        const plot_style: React.CSSProperties = {position: 'absolute', bottom: -1}
        plot_style[left_side ? 'right' : 'left'] = '100%'
        if (!left_side) {
          plot_style
        }
        const anchor_style: React.CSSProperties = {position: 'absolute', bottom: 0, width: 0, height: 0}
        anchor_style[left_side ? 'right' : 'left'] = 0
        return div(
          {key: i},
          {style},
          {style: {width: 50}},
          css`border-bottom: 1px #666 solid`,
          css`display: flex`,
          left_side || css`padding-right: 15px`,
          left_side || css`justify-content: flex-end`,
          // css`& > label { padding: 0 8; }`,
          div(
            css`position: absolute; top: 100%`,
            x.label,
          ),
          div(
            css`margin-bottom: 2px`,
            css`margin-left: 8px`,
            x.checkbox
          ),
          {
            onClick: x.onClick,
            onMouseOver: () => set_hover(pretty(codes[x.text])),
            onMouseOut: () => hover === pretty(codes[x.text]) && set_hover(''),
          },
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
                  x_axis: (i + 1) % T == 0,
                  max: Math.max(...db.filter(row => store.get().cell[row.cell]).map(row => row.expression)),
                }
              )))
        })

  return div(
    {
      id: 'center',
      style: {
        position: 'relative',
      },
    },
    <img src={require('./img/center-trimmed.svg')} style={{
      // width: '24%',
      position: 'absolute',
      width: '64%',
      left: '50%',
      top: 50,
      transform: 'translate(-50%, 0)',
    }}/>,
    ...tumor_labels,
    div(
      {
        style: {
          position: 'absolute',
          top: 660,
          left: '49%',
          width: '100%',
          textAlign: 'center',
          transform: 'translate(-50%, 0)',
        }
      },
      hover
    ),
  )
}

// import {thief} from './thief'
const thief: undefined | ((cell: string, img: HTMLImageElement | null) => void) = undefined

function Left() {
  return (
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
            const img_props: React.ImgHTMLAttributes<HTMLImageElement> = thief ? {onLoad: e => thief(cell, e.target as any)} : {}
            const img = cell_png && <img src={cell_png} {...img_props}/>
            return <label onClick={x.onClick}>{div(
              css`
                display: flex
                flex-direction: row
                // justify-content: space-between
                border: 1.5px #ddd solid
                border-radius: 2px
                font-size: 0.8em
              `,
              css`& > * {
                margin: auto 0;
                padding: 5px;
                flex: 1;
              }`,
              div(
                {style: {flex: 0}},
                x.checkbox
              ),
              div(
                // {style: {flex: 0.7}},
                css`display: flex;`,
                css`& > * { margin: auto; flex-grow: 0; }`,
                img
              ),
              x.label
            )
          }</label>})}
    </div>
  )
}

function Root() {
  return (
    <div id="top" className="row">
      <Left/>
      <Center/>
      <Right/>
    </div>
  )
}

function selected(d: Record<string, boolean>): string[] {
  return Object.entries(d).filter(([_, v]) => v).map(([k, _]) => k)
}

function Right() {
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
  return div(
    {
      id: 'right-sidebar',
      className: 'column',
    },
    css`& > div { margin: 10px auto }`,
    out
  )
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

