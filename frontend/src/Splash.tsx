import * as React from 'react'

import {by} from './utils'
import * as utils from './utils'

import {cellOrder} from './db'

import type {DB, Row} from './db'

import {css, div} from './ui_utils'

import {Domplot, DomplotCSS} from './Domplot'

import {css as emotion_css} from 'emotion'

import {cell_color} from './cell_colors'

import * as backend from './backend'

import * as ui from './ui_utils'

import B_cells from './img/B_cells.png'
import CD4 from './img/CD4.png'
import CD4_Treg from './img/CD4_Treg.png'
import CD8 from './img/CD8.png'
import CD8_Treg from './img/CD8_Treg.png'
import M1 from './img/M1.png'
import M2 from './img/M2.png'
import NK from './img/NK.png'
import NKT from './img/NKT.png'
import mDC from './img/mDC.png'
import pDC from './img/pDC.png'
import iDC from './img/iDC.png'
import Myeloid_cell from './img/Myeloid.png'
import Granulocyte from './img/Granulocytes.png'

import * as c from './Center'

const cell_pngs: Record<string, string> = {
  B_cells,
  CD4,
  CD4_Treg,
  CD8,
  CD8_Treg,
  M1,
  M2,
  NK,
  NKT,
  mDC,
  pDC,
  iDC,
  'Myeloid cell': Myeloid_cell,
  Granulocyte,
}

import center_img from './img/center-trimmed.svg'

const left = 'MEL LUAD LUSC ESCA STAD KRCC BLCA PRAD'.split(' ')
const right = 'BRCA PPADpb PPADi COAD READ OVSA OVNSA UCEC'.split(' ')
const both = [...left, ...right]

// import {thief} from './thief'
const thief: undefined | ((cell: string, img: HTMLImageElement | null) => void) = undefined

interface State {
  tumor: Record<string, boolean>
  cell: Record<string, boolean>
}

const state0: State = {
  tumor: {},
  cell: {CD4: true},
}

interface Action {
  type: 'set'
  kind: 'cell' | 'tumor'
  value: string
  checked: boolean
}

function reduce(state: State, action: Action): State {
  switch (action.kind) {
    case 'cell':
      return {tumor: {}, cell: utils.cap(2, {...state.cell, [action.value]: action.checked})}
    case 'tumor':
      return {cell: {}, tumor: utils.cap(1, {...state.tumor, [action.value]: action.checked})}
  }
}

interface SplashProps {
  state: State
  dispatch: (action: Action) => void
  db?: DB
  range?: utils.RowRange<Row>
  codes: Record<string, string>
}

const classes = {
  Splash: emotion_css({
    ...ui.flex_row,
    // background: 'white',
    // display: 'inline-flex',
    '& > *': {
      flexShrink: 0,
      flexGrow: 0,
    },
    userSelect: 'none',
    '& label': {
      cursor: 'pointer',
    },
    '& h2': {
      margin: '10 auto',
      fontSize: '1.2em',
    },
  }),
  Left: emotion_css({
    ...ui.flex_column,
    width: 150,
  }),
  LeftLabel: emotion_css({
    ...ui.flex_row,

    border: '2px var(--cell-color) solid',
    borderRadius: 4,
    background: 'white',
    color: 'black',
    '&.Checked': {
      background: 'var(--cell-color)',
      color: 'white',
    },

    '& > *': {
      ...ui.flex_row,
      '& > *': {
        margin: 'auto',
      },
    },

    margin: '2 0',
    padding: '3 0',
    // sizes are adapted to iDC being 45 px (100%)
    height: 55,
    '& > .has-img': {
      width: 66,
      height: '100%',
      '& > img': {
        maxHeight: '100%',
      },
    },
    '& > .has-span': {
      flex: 1,
      '& > span': {
        fontSize: '0.9em',
      },
    },
  }),
  Center: emotion_css({
    width: 750,
    marginTop: 40,
    minHeight: 680,
    position: 'relative',
  }),
  Right: emotion_css({
    ...ui.flex_column,
    borderLeft: '1px #ddd solid',
    paddingTop: 0,
    paddingLeft: 15,
    paddingRight: 15,
    overflowY: 'auto',
    overflowX: 'hidden',
    height: 900,
    width: 175,
    '& > div': {
      marginBottom: 15,
      flexShrink: 0,
    },
  }),
}

function Checkboxes(
  range: string[],
  current: Record<string, boolean>,
  toggle: (value: string, checked: boolean) => void,
  color: (s: string) => string = () => 'black'
) {
  return range.map(x => {
    const checked = current[x]
    const onClick = () => toggle(x, checked)
    return {
      checked,
      text: x,
      onClick,
      label: <label htmlFor={x}>{utils.pretty(x)}</label>,
      checkbox: (
        <span
          id={x}
          onClick={onClick}
          style={{
            borderRadius: '100px',
            border: `2px ${color(x)} solid`,
            background: checked ? color(x) : 'none',
            width: '12px',
            height: '12px',
            display: 'inline-block',
          }}
        />
      ),
    }
  })
}

function Center({state, dispatch, codes, db}: SplashProps) {
  const [hover, set_hover] = React.useState('')
  const tumor_labels = Checkboxes(
    both,
    state.tumor,
    (value, checked) => dispatch({type: 'set', kind: 'tumor', value, checked: !checked}),
    () => '#444'
  ).map((x, i) => {
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
      style.top = top_off + i * plot_sep
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
      css`
        border-bottom: 1px #666 solid;
        display: flex;
      `,
      left_side ||
        css`
          padding-right: 7px;
          justify-content: flex-end;
        `,
      // css`& > label { padding: 0 8; }`,
      div(
        css`
          position: absolute;
          top: 100%;
          margin-left: 6px;
        `,
        x.label
      ),
      div(
        css`
          margin-bottom: 2px;
          margin-left: 8px;
        `,
        x.checkbox
      ),
      css`
        cursor: pointer;
      `,
      {
        onClick: x.onClick,
        onMouseOver: () => set_hover(utils.pretty(codes[x.text])),
        onMouseOut: () => hover === utils.pretty(codes[x.text]) && set_hover(''),
      },
      div(
        css`
          position: relative;
        `,
        div(css`
              border-bottom: 1px #666 solid
              position: absolute
              width: 100%
              bottom: 0
              left: 0
              z-index: 3
            `),
        {style: plot_style},
        !db || !utils.selected(state.cell).length ? null : (
          <Domplot
            rows={db.filter(row => state.cell[row.cell] && row.tumor == tumor)}
            kind="bar"
            options={{
              axis_right: !left_side,
              height: plot_height,
              hulled: false,
              x_axis: (i + 1) % T == 0,
              max: Math.max(...db.filter(row => state.cell[row.cell]).map(row => row.expression)),
            }}
          />
        )
      )
    )
  })

  return (
    <div className={classes.Center}>
      <div

        style={{
          // width: '24%',
          position: 'absolute',
          left: '50%',
          top: 0,
          transform: 'translate(-50%, 0)',
        }}

      >
      <c.Center   />
      </div>

      {

      false && <img
        src={center_img}
      />
      }
      {tumor_labels}
      <div
        style={{
          position: 'absolute',
          top: 660,
          left: '49%',
          width: '100%',
          textAlign: 'center',
          transform: 'translate(-50%, 0)',
        }}>
        {hover}
      </div>
    </div>
  )
}

const clsx = (...xs: any[]) => xs.filter(x => typeof x === 'string').join(' ')

function Left({state, dispatch, range}: SplashProps) {
  return (
    <div className={classes.Left}>
      <h2>Cell type</h2>
      {range &&
        Checkboxes(
          cellOrder.filter(cell => range.cell.includes(cell)),
          state.cell,
          (value, checked) => dispatch({type: 'set', kind: 'cell', value, checked: !checked}),
          cell_color
        ).map((x, i) => {
          const cell = range.cell[i]
          const cell_png = cell_pngs[range.cell[i]]
          const img_props: React.ImgHTMLAttributes<HTMLImageElement> = thief
            ? {onLoad: e => thief(cell, e.target as any)}
            : {}
          const img = cell_png && <img src={cell_png} {...img_props} />
          const color = cell_color(x.text)
          return (
            <label
              key={i}
              id={cell}
              htmlFor={cell}
              onClick={x.onClick}
              style={{'--cell-color': color} as any}
              className={clsx(classes.LeftLabel, x.checked && 'Checked')}>
              <div className="has-img">{img}</div>
              <div className="has-span">
                <span>{utils.pretty(cell)}</span>
              </div>
            </label>
          )
        })}
    </div>
  )
}

function Right({state, db}: SplashProps) {
  const out: React.ReactNode[] = []

  const renames: Record<string, string> = {
    'Myeloid cell': 'Myeloid',
    Granulocyte: 'Gran...',
  }

  const rename_row = (row: Row): Row => ({...row, cell: renames[row.cell] || row.cell})

  if (db) {
    const {tumor, cell} = state
    const tumors = utils.selected(tumor)
    const cells = utils.selected(cell)
    const opts = {orientation: 'portrait' as 'portrait', axis_right: true}
    for (const t of tumors) {
      out.push(<h2>{utils.pretty(t)}</h2>)
      out.push(
        <Domplot
          rows={db.filter(row => row.tumor == t).map(rename_row)}
          kind="bar"
          options={opts}
        />
      )
      out.push(
        <Domplot
          rows={db.filter(row => row.tumor == t).map(rename_row)}
          kind="forest"
          options={opts}
        />
      )
    }
    for (const c of cells) {
      out.push(<h2>{utils.pretty(c)}</h2>)
      out.push(
        <Domplot
          rows={db.filter(row => row.cell == c)}
          kind="forest"
          options={{facet_x: 'tumor', ...opts}}
        />
      )
    }
  }

  return <div className={classes.Right}>{ui.dummy_keys(out)}</div>
}

export const Splash = React.memo(function Splash() {
  const db0 = backend.useRequest('database') as undefined | DB
  const db = db0 && db0.sort(by(row => both.indexOf(row.tumor)))

  const range = React.useMemo(() => (db ? utils.row_range(db) : undefined), [db])
  const codes = (backend.useRequest('codes') as Record<string, string>) || {}

  Object.keys(codes).length &&
    both.forEach(b => {
      b in codes || console.error(b, 'not in', codes)
    })

  const [state, dispatch] = React.useReducer(reduce, state0)

  const splash_props: SplashProps = {state, dispatch, range, codes, db}

  return (
    <div className={classes.Splash}>
      <DomplotCSS />
      <Left {...splash_props} />
      <Center {...splash_props} />
      <Right {...splash_props} />
    </div>
  )
})
