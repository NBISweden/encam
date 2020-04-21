import * as React from 'react'

import {by} from './utils'
import * as utils from './utils'

import {CT, Row, range, db, filter, pick_cells, make_gen} from './db'

import {css, div} from './css'

import {plot, cell_color} from './domplots'
import * as domplots from './domplots'

import styled, * as sc from 'styled-components'

export const GlobalStyle = sc.createGlobalStyle`
  label {
    cursor: pointer;
    padding-top: 2px;
    padding-bottom: 2px;
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
    padding: 0 1em;
  }
  #center {
    width: 750px;
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
`

const state0 = {
  tumor: {} as Record<string, boolean>,
  cell: {CD4: true} as Record<string, boolean>,
}

type State = typeof state0

function Checkboxes(range: string[], current: Record<string, boolean>, toggle: (value: string) => void, color: (s: string) => string = () => 'black') {
  return range.map(x => {
    const checked = current[x]
    const onClick = () => toggle(x)
    return {
      checked,
      text: x,
      onClick,
      label: <span>{utils.pretty(x)}</span>,
      checkbox:
        <span
          onClick={onClick}
          style={{
            borderRadius: '100px',
            border: `2px ${color(x)} solid`,
            background: checked ? color(x) : 'none',
            width: '12px',
            height: '12px',
            display: 'inline-block',
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

db.sort(by(row => both.indexOf(row.tumor)))

function Center({state, dispatch}: {state: State, dispatch: React.Dispatch<Action>}) {
  const [hover, set_hover] = React.useState('')
  const tumor_labels =
    Checkboxes(
      both,
      state.tumor,
      value => dispatch({type: 'toggle', kind: 'tumor', value}),
      () => '#444')
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
          left_side || css`padding-right: 7px`,
          left_side || css`justify-content: flex-end`,
          // css`& > label { padding: 0 8; }`,
          div(
            css`position: absolute; top: 100%; margin-left: 6px`,
            x.label,
          ),
          div(
            css`margin-bottom: 2px`,
            css`margin-left: 8px`,
            x.checkbox
          ),
          css`cursor: pointer`,
          {
            onClick: x.onClick,
            onMouseOver: () => set_hover(utils.pretty(codes[x.text])),
            onMouseOut: () => hover === utils.pretty(codes[x.text]) && set_hover(''),
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
            !utils.selected(state.cell).length ? null :
              plot(
                db.filter(row => state.cell[row.cell] && row.tumor == tumor),
                'bar',
                {
                  axis_right: !left_side,
                  height: plot_height,
                  hulled: false,
                  x_axis: (i + 1) % T == 0,
                  max: Math.max(...db.filter(row => state.cell[row.cell]).map(row => row.expression)),
                }
              )))
        })

  return div(
    {
      id: 'center',
      style: {},
    },
    div(
      {
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
  )
}

// import {thief} from './thief'
const thief: undefined | ((cell: string, img: HTMLImageElement | null) => void) = undefined

function Left({state, dispatch}: {state: State, dispatch: React.Dispatch<Action>}) {
  return (
    <div id="left-sidebar" className="column">
      <h2>Cell type</h2>
      {Checkboxes(
          range.cell,
          state.cell,
          value => dispatch({type: 'toggle', kind: 'cell', value}),
          cell_color
        ).map((x, i) => {
            const cell = range.cell[i]
            const cell_png = cell_pngs[range.cell[i]]
            const img_props: React.ImgHTMLAttributes<HTMLImageElement> = thief ? {onLoad: e => thief(cell, e.target as any)} : {}
            const img = cell_png && <img src={cell_png} {...img_props}/>
            const color = cell_color(x.text)
            return <label key={i} onClick={x.onClick}>{div(
              {style: {
                border: `1.5px ${color} solid`,
                background: x.checked ? color : 'white',
                color: x.checked ? 'white' : 'black',
              }},
              css`
                display: flex;
                flex-direction: row;
                // justify-content: space-between;
                border-radius: 15px;
                font-size: 0.8em;
              `,
              css`& > * {
                margin: auto 0;
                padding: 2px;
                flex: 1;
              }`,
              div(
                css`display: flex;`,
                css`& > * { margin: auto; flex-grow: 0; }`,
                img
              ),
              div(
                css`
                  display: inline;
                  text-align: center;
                `,
                x.label
              )
            )
          }</label>})}
    </div>
  )
}

function Right({state}: {state: State}) {
  const out: React.ReactNode[] = []

  const {tumor, cell} = state
  const tumors = utils.selected(tumor)
  const cells  = utils.selected(cell)
  const opts   = {orientation: 'portrait' as 'portrait', axis_right: true}
  for (const t of tumors) {
    out.push(<h2 style={{margin: '10 auto'}}>{utils.pretty(t)}</h2>)
    out.push(plot(filter('tumor', t), 'bar', opts))
    out.push(plot(filter('tumor', t), 'forest', opts))
  }
  for (const c of cells) {
    out.push(<h2 style={{margin: '10 auto'}}>{utils.pretty(c)}</h2>)
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

interface Action {
  type: 'toggle'
  kind: 'cell' | 'tumor'
  value: string
}

function reduce(state: State, action: Action) {
  switch (action.kind) {
    case 'cell':
      return {tumor: {}, cell: utils.cap(3, {...state.cell, [action.value]: !state.cell[action.value]})}
    case 'tumor':
      return {cell: {}, tumor: utils.cap(1, {...state.tumor, [action.value]: !state.tumor[action.value]})}
  }
}

export default function Splash() {
  const [state, dispatch] = React.useReducer(reduce, state0)
  return (
    <div id="top" className="row">
      <domplots.GlobalStyle/>
      <GlobalStyle/>
      <Left state={state} dispatch={dispatch}/>
      <Center state={state} dispatch={dispatch}/>
      <Right state={state}/>
    </div>
  )
}


