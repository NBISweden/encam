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

const svgs = {
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

const positions = [
  {bodies: {x: 0.796, y: 0.461}, organ: {x: -0.011, y: 0.235}, id: 'gut'},
  {bodies: {x: 0.807, y: 0.511}, organ: {x: -0.01, y: 0.183}, id: 'ovary'},
  {bodies: {x: 0.816, y: 0.406}, organ: {x: -0.03, y: 0.42}, id: 'pancreas'},
  {bodies: {x: 0.839, y: 0.278}, organ: {x: -0.111, y: 0.695}, id: 'breast'},
  {bodies: {x: 0.775, y: 0.507}, organ: {x: -0.067, y: 0.332}, id: 'uterus'},
  {bodies: {x: 0.295, y: 0.532}, organ: {x: 0.953, y: 0.536}, id: 'prostate'},
  {bodies: {x: 0.283, y: 0.517}, organ: {x: 0.907, y: 0.969}, id: 'bladder'},
  {bodies: {x: 0.252, y: 0.48}, organ: {x: 1.058, y: 0.321}, id: 'kidney'},
  {bodies: {x: 0.285, y: 0.369}, organ: {x: 1.027, y: 0.565}, id: 'stomach'},
  {bodies: {x: 0.285, y: 0.293}, organ: {x: 0.458, y: 0.004}, id: 'stomach'},
  {bodies: {x: 0.122, y: 0.184}, organ: {x: 0.67, y: 0.936}, id: 'skin'},
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

const Svg = ({id}: {id: string}) => ( <img src={(svgs as any)[id]} id={id} /> )

export function Center() {
  const [rects, set_rects] = React.useState({} as Record<string, DOMRect>)
  const update_rects = (d: HTMLElement) =>
    set_rects(
      Object.fromEntries(Array.from(d.parentElement!.querySelectorAll('[id]')).map(e =>
        [e.id, e.getBoundingClientRect()]
      ))
    )

  console.log(rects)

  return <div id="center" css={css`display: flex; flex-direction: row; position: relative;
      &, & svg {
        height: 520; width: 500;
      }
    `}
      onLoad={React.useCallback(e => update_rects(e.currentTarget), [])}
      ref={React.useCallback(e => e && update_rects(e), [])}
     >
    <svg css={css`position: absolute; z-index: 1000`}>
      {positions.map(({id, bodies, organ}) => {
        if (rects.bodies && rects[id] && rects.center) {
          const sx = bodies.x * rects.bodies.width - rects.center.left + rects.bodies.left
          const sy = bodies.y * rects.bodies.height- rects.center.top + rects.bodies.top
          const tx = organ.x * rects[id].width - rects.center.left + rects[id].left
          const ty = organ.y * rects[id].height - rects.center.top + rects[id].top
          return <path d={`M${sx} ${sy} L${tx} ${ty}`} stroke="black" fill="transparent"/>
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
      <div css={css`flex-grow: 1`}/>
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
