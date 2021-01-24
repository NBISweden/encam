/**

  This is the fancy graphics with bodies buttons and graphs on the front page,
  slightly incorrectly referred to in the entire code base as the "Splash" page.
  Most of the code is in Center (generated by Bodies) and Domplots, but there is
  still a surprising amount of wiring to be done after those modules. So here goes...

*/
import * as React from 'react'

import {by} from './utils'
import * as utils from './utils'

import {cellOrder} from './splash_db'

import type {SplashDB, SplashRow} from './splash_db'

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

import {Dyn, useDyn} from './ui_utils/Dyn'

import {SectionInfo} from './Info'
// import {SectionInfo} from './Content'

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
  db?: SplashDB
  range?: utils.RowRange<SplashRow>
  codes: Record<string, string>
}

const classes = {
  Splash: emotion_css({
    ...ui.flex_row,
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
  const dyn = useDyn()

  return (
    <div className={classes.Center} style={{display: 'flex'}}>
      <c.Center
        withTumor={(tumor: string, side: 'left' | 'right') => {
          const flexDirection = side === 'left' ? 'row-reverse' : 'row'
          const opp_side = side === 'left' ? 'right' : 'left'
          const plot_height = Math.round(dyn('plot height', 60, 20, 120))
          return (
            <div
              key={tumor}
              style={{
                gridArea: tumor,
                position: 'relative',
              }}>
              <div
                style={{
                  position: 'absolute',
                  [opp_side]: 0,
                  bottom: -dyn('label offset', 30, 0, 80),
                  display: 'flex',
                  flexDirection,
                  justifySelf: side == 'left' ? 'end' : 'start',
                  justifyContent: 'space-between',
                  alignSelf: 'end',
                  alignItems: 'flex-end',
                }}>
                <svg
                  width="20"
                  height="100"
                  style={{
                    position: 'absolute',
                    [side === 'left' ? 'left' : 'right']: '100%',
                    bottom: -9,
                    transform: side === 'right' ? 'scaleX(-1)' : undefined,
                    zIndex: 0,
                  }}>
                  <path
                    d={
                      tumor.match(/^(luad|esca|ppadpb|coad|ovsa)$/i)
                        ? 'M0 90 l6 6'
                        : tumor.match(/^(lusc|stad|ppadi|read|ovnsa)$/i)
                        ? 'M0 90 l6 -6 l0 -40'
                        : 'M0 90 l6 -6'
                    }
                    stroke="#aaa"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>

                <div
                  style={{
                    borderBottom: '2px #aaa solid',
                    margin: '0px 0px 0',
                    width: 80,
                    // transform: 'translate(0, 5px)',
                    display: 'flex',
                    flexDirection,
                  }}>
                  <SectionInfo id={tumor} dir={opp_side} />
                  <span style={{marginLeft: 2, marginRight: 2}}>{tumor}</span>
                </div>
                <div
                  style={{
                    borderBottom: '2px #aaa solid',
                  }}>
                  {!db || !utils.selected(state.cell).length ? null : (
                    <Domplot
                      rows={db
                        .filter(row => state.cell[row.cell] && row.tumor == tumor)
                        .map(rename_row)}
                      kind="bar"
                      options={{
                        axis_right: side != 'left',
                        height: plot_height,
                        hulled: false,
                        x_axis: true,
                        max: Math.max(
                          ...db.filter(row => state.cell[row.cell]).map(row => row.expression)
                        ),
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          )
        }}
      />
      {
        //  tumor_labels
      }
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

const renames: Record<string, string> = {
  'Myeloid cell': 'Myel...',
  Myeloid_cell: 'Myel...',
  Granulocyte: 'Gran...',
  CD4_Treg: 'CD4 T...',
  CD8_Treg: 'CD8 T...',
}

const rename_row = (row: SplashRow): SplashRow => (
  console.log(row.cell, renames[row.cell]), {...row, cell: renames[row.cell] || row.cell}
)

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
                <div style={{marginRight: 0, marginLeft: 0}}>
                  <SectionInfo
                    id={
                      // "Myeloid cell" is sent from backend without underscore
                      cell.replace(/ /g, '_')
                    }
                  />
                </div>
              </div>
            </label>
          )
        })}
    </div>
  )
}

function Right({state, db}: SplashProps) {
  const out: React.ReactNode[] = []

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

/**

  We used to serve the database statically as an embedded json but to
  make it possible to change it without rebuilding the frontend we get
  it from the backend.

  React's useReducer does its sole appearance in the code base.
  Not a strong game by useReducer, but still: welcome!

*/
function useSplashProps(): SplashProps {
  const db0 = backend.useRequest('database') as undefined | SplashDB
  const db = db0 && db0.sort(by(row => both.indexOf(row.tumor)))

  const range = React.useMemo(() => (db ? utils.row_range(db) : undefined), [db])
  const codes = (backend.useRequest('codes') as Record<string, string>) || {}

  Object.keys(codes).length &&
    both.forEach(b => {
      b in codes || console.error(b, 'not in', codes)
    })

  const [state, dispatch] = React.useReducer(reduce, state0)

  return {state, dispatch, range, codes, db}
}

export const Splash = React.memo(function Splash() {
  const splash_props = useSplashProps()
  return (
    <Dyn>
      <div className={classes.Splash}>
        <DomplotCSS />
        <Left {...splash_props} />
        <Center {...splash_props} />
        <Right {...splash_props} />
      </div>
    </Dyn>
  )
})

import stories from '@app/ui_utils/stories'

function LeftOnly() {
  return <Left {...useSplashProps()} />
}

stories(add => {
  add(<Splash />)
  add({mock: <Splash />})
    .wrap(backend.mock(import('./data/splash')))
    .snap()
  add(<LeftOnly />)
    .wrap(backend.mock(import('./data/splash')))
    .snap()
})
