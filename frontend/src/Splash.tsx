import * as React from 'react'

import {by} from './utils'
import * as utils from './utils'

import {cellOrder} from './db'

import type {DB, Row} from './db'

import {css, div} from './ui_utils'

import {Domplot, DomplotCSS} from './Domplot'

import {makeStyles} from '@material-ui/core/styles'

import {cell_color} from './cell_colors'

import * as backend from './backend'

import * as ui from './ui_utils'

declare const require: (s: string) => string

const IN_JEST =
  typeof process !== 'undefined' && process.env.JEST_WORKER_ID ? 'dummy.png' : undefined

const cell_pngs: Record<string, string> = {
  B_cells: IN_JEST || require('../img/B_cells.png'),
  CD4: IN_JEST || require('../img/CD4.png'),
  CD4_Treg: IN_JEST || require('../img/CD4_Treg.png'),
  CD8: IN_JEST || require('../img/CD8.png'),
  CD8_Treg: IN_JEST || require('../img/CD8_Treg.png'),
  M1: IN_JEST || require('../img/M1.png'),
  M2: IN_JEST || require('../img/M2.png'),
  NK: IN_JEST || require('../img/NK.png'),
  NKT: IN_JEST || require('../img/NKT.png'),
  mDC: IN_JEST || require('../img/mDC.png'),
  pDC: IN_JEST || require('../img/pDC.png'),
  iDC: IN_JEST || require('../img/iDC.png'),

  'Myeloid cell': IN_JEST || require('../img/Myeloid.png'),
  Granulocyte: IN_JEST || require('../img/Granulocytes.png'),
}

const center_img = IN_JEST || require('../img/center-trimmed.svg')

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
      return {tumor: {}, cell: utils.cap(3, {...state.cell, [action.value]: action.checked})}
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

const useStyles = makeStyles({
  Splash: {
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
  },
  Left: {
    ...ui.flex_column,
    width: 165,
  },
  LeftLabel: {
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
  },
  Center: {
    width: 750,
    marginTop: 40,
    minHeight: 680,
    position: 'relative',
  },
  Right: {
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
  },
})

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
  const classes = useStyles()
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
      css`border-bottom: 1px #666 solid`,
      css`display: flex`,
      left_side || css`padding-right: 7px`,
      left_side || css`justify-content: flex-end`,
      // css`& > label { padding: 0 8; }`,
      div(css`position: absolute; top: 100%; margin-left: 6px`, x.label),
      div(css`margin-bottom: 2px`, css`margin-left: 8px`, x.checkbox),
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
      <img
        src={center_img}
        style={{
          // width: '24%',
          position: 'absolute',
          width: '64%',
          left: '50%',
          top: 50,
          transform: 'translate(-50%, 0)',
        }}
      />
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
  const classes = useStyles()
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
  const classes = useStyles()

  const out: React.ReactNode[] = []

  const renames = {
    'Myeloid cell': 'Myeloid',
    Granulocyte: 'Gran...',
  }

  const rename_row = row => ({...row, cell: renames[row.cell] || row.cell})

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

export function Splash() {
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

  const classes = useStyles()
  return (
    <div className={classes.Splash}>
      <DomplotCSS />
      <Left {...splash_props} />
      <Center {...splash_props} />
      <Right {...splash_props} />
    </div>
  )
}
