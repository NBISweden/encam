// @jsx jsx
// @jsxFrag React.Fragment
import {jsx, css} from '@emotion/core'
import * as React from 'react'

import svg_bodies from './img/bodies.svg'
import svg_gut from './img/gut.svg'
import svg_lungs from './img/lungs.svg'
import svg_ovary from './img/ovary.svg'
import svg_pancreas from './img/pancreas.svg'
import svg_breast from './img/breast.svg'
import svg_uterus from './img/uterus.svg'
import svg_prostate from './img/prostate.svg'
import svg_bladder from './img/bladder.svg'
import svg_kidney from './img/kidney.svg'
import svg_stomach from './img/stomach.svg'
import svg_skin from './img/skin.svg'

const svgs: Record<string, string> = {
  bodies: svg_bodies,
  gut: svg_gut,
  lungs: svg_lungs,
  ovary: svg_ovary,
  pancreas: svg_pancreas,
  breast: svg_breast,
  uterus: svg_uterus,
  prostate: svg_prostate,
  bladder: svg_bladder,
  kidney: svg_kidney,
  stomach: svg_stomach,
  skin: svg_skin,
}

const sizes: Record<string, {width: number, height: number}> = {
  skin: {width: 97.4, height: 49.9},
  lungs: {width: 81.6, height: 78.4},
  stomach: {width: 60.8, height: 57.7},
  kidney: {width: 79.3, height: 68.6},
  bladder: {width: 59.7, height: 56.9},
  prostate: {width: 53.8, height: 64.5},
  bodies: {width: 174.6, height: 258.0},
  breast: {width: 46.5, height: 56},
  pancreas: {width: 99.9, height: 48.4},
  gut: {width: 88.1, height: 103.2},
  ovary: {width: 91.7, height: 47.2},
  uterus: {width: 49.7, height: 57.0}
}

const positions = [
  {bodies: {x: 0.796, y: 0.461}, organ: {x: -0.011, y: 0.235}, id: 'gut'},
  {bodies: {x: 0.807, y: 0.511}, organ: {x: -0.01, y: 0.183}, id: 'ovary'},
  {bodies: {x: 0.816, y: 0.406}, organ: {x: -0.03, y: 0.42}, id: 'pancreas'},
  {bodies: {x: 0.839, y: 0.278}, organ: {x: -0.111, y: 0.695}, id: 'breast'},
  {bodies: {x: 0.775, y: 0.507}, organ: {x: -0.067, y: 0.332}, id: 'uterus'},
  {bodies: {x: 0.295, y: 0.532}, organ: {x: 0.953, y: 0.536}, id: 'prostate'},
  {bodies: {x: 0.283, y: 0.517}, organ: {x: 0.907, y: 0.969}, id: 'bladder'},
  {bodies: {x: 0.252, y: 0.48}, organ: {x: 1.058, y: 0.321}, id: 'kidney'},
  {bodies: {x: 0.285, y: 0.369}, organ: {x: 1.027, y: 0.565}, id: 'stomach', lower: true},
  {bodies: {x: 0.285, y: 0.293}, organ: {x: 0.458, y: 0.004}, id: 'stomach'},
  {bodies: {x: 0.122, y: 0.184}, organ: {x: 0.67, y: 0.936}, id: 'skin'},
  {bodies: {x: 0.218, y: 0.23}, organ: {x: 0.956, y: 0.385}, id: 'lungs'},
]

const left = {
  skin: 1,
  lungs: 2,
  stomach: 2,
  kidney: 1,
  bladder: 1,
  prostate: 1,
}

const right = {
  breast: 1,
  pancreas: 2,
  gut: 2,
  ovary: 2,
  uterus: 1,
}

import * as ui from './ui_utils'
import * as utils from './utils'

const Svg = ({id}: {id: string}) => ( <img src={svgs[id]} id={id}
  {...utils.mapObject(sizes[id], (s: number) => id === 'bodies' ? s : s * 0.85)} /> )

export function Center() {
  const [rects, set_rects] = React.useState({} as Record<string, DOMRect>)
  const update_rects = (d: HTMLElement) =>
    set_rects(
      Object.fromEntries(Array.from(d.parentElement!.querySelectorAll('[id]')).map(e =>
        [e.id, e.getBoundingClientRect()]
      ))
    )

  console.log(JSON.stringify(
    utils.mapObject(rects, d => ({width: d.width, height: d.height})))
  )

  return <div id="center" css={css(`display: flex; flex-direction: row; position: relative;
      &, & svg {
        height: 700; width: 400;
      }
      margin: 10;
    `, false && `
      border: 1px steelblue solid;
      & * {
        border: 1px steelblue solid;
        padding: 1px;
      }
    `)}
      onLoad={React.useCallback(e => update_rects(e.currentTarget), [])}
      ref={React.useCallback(e => e && update_rects(e), [])}
     >
    <svg css={css`position: absolute; z-index: 1`}>
      {positions.map(({id, bodies, organ, lower}) => {
        if (rects.bodies && rects[id] && rects.center) {
          const weight: Record<string, number> = {
            stomach: 1,
            kidney: 2,
            bladder: 3,
            prostate: 4,
            breast: 3,
            pancreas: 1,
            gut: 2,
            ovary: 2.5,
            uterus: 6,
          }
          const sx = bodies.x * rects.bodies.width - rects.center.left + rects.bodies.left
          const sy = bodies.y * rects.bodies.height- rects.center.top + rects.bodies.top
          const tx = organ.x * rects[id].width - rects.center.left + rects[id].left
          const ty = organ.y * rects[id].height - rects.center.top + rects[id].top
          const w = weight[id]
          const hx = (tx + w * sx) / (w + 1) + (lower ? -10 : 0)
          const hy = (ty + sy) / 2
          let d = `M${sx} ${sy} Q${hx} ${sy} ${hx} ${hy} T${tx} ${ty}`
          if (id === 'lungs') {
            d = `M${sx} ${ty} L${tx} ${ty}`
          }
          if (id === 'skin') {
            const w = 0.2
            const hx = (tx + sx) / 2
            const hy = (ty + w * sy) / (w + 1)
            d = `M${sx} ${sy} Q${sx} ${hy} ${hx} ${hy} T${tx} ${ty}`
          }
          return <path note={id} d={d} stroke="black" fill="transparent"/>
        }
        })
      }
    </svg>
    <div css={css`display: flex; flex-direction: column`}>
      {Object.entries(left).map(([k, v]) =>
        <div key={k} css={css`flex-grow: ${v}; flex-basis: 0; display: flex; && * { margin: auto; margin-left: 0 }`}>
          <Svg id={k} />
        </div>
      )}
    </div>
    <div css={css`flex-grow: 1; display: flex; flex-direction: column; && * { margin: auto }`}>
      <div css={css`flex-grow: 1; display: flex;`}><Svg  id="bodies" /></div>
      <div css={css`flex-grow: 1.08`}/>
    </div>
    <div css={css`display: flex; flex-direction: column`}>
      {Object.entries(right).map(([k, v]) =>
        <div key={k} css={css`flex-grow: ${v}; flex-basis: 0; display: flex; && * { margin: auto; margin-right: 0 }`}>
          <Svg id={k} />
        </div>
      )}
    </div>
  </div>
}
