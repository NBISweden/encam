// @jsx jsx
// @jsxFrag React.Fragment
import {jsx, css} from '@emotion/core'
import * as React from 'react'

import * as ui from './utils'
import * as utils from './utils'

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

const sizes: Record<string, {width: number; height: number}> = {
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
  uterus: {width: 49.7, height: 57.0},
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
  {bodies: {x: 0.128, y: 0.184}, organ: {x: 0.67, y: 0.936}, id: 'skin'},
  {bodies: {x: 0.218, y: 0.23}, organ: {x: 0.956, y: 0.385}, id: 'lungs'},
]

const template = `
  "MEL   skin     bodies breast   BRCA  "
  "LUAD  lungs    bodies pancreas PPADpb"
  "LUSC  lungs    bodies pancreas PPADi "
  "ESCA  stomach  bodies gut      COAD  "
  "STAD  stomach  bodies gut      READ  "
  "KRCC  kidney   bodies ovary    OVSA  "
  "BLCA  bladder  bodies ovary    OVNSA "
  "PRAD  prostate bodies uterus   UCEC  "
`

const Svg = ({id, ...props}: {id: string} & React.HTMLProps<HTMLImageElement>) => (
  <img
    id={id}
    {...(utils.mapObject(sizes[id], (s: number) =>
      Math.round(
        s *
          (id === 'bodies'
            ? useDyn()('bodies size', 1, 0.5, 1.75)
            : useDyn()('organ size', 0.85, 0.4, 1.5))
      )
    ) as any)}
    {...props}
    src={svgs[id]}
  />
)

const grid = template
  .replace(/"/g, '')
  .trim()
  .split(/\n/)
  .map(s => s.trim().split(/\s+/))

const left_tumors = utils.uniq(grid.map(row => row[0]))
const left_organs = utils.uniq(grid.map(row => row[1]))
const right_tumors = utils.uniq(grid.map(row => row[4]))
const right_organs = utils.uniq(grid.map(row => row[3]))

import {Dyn, useDyn} from './ui_utils/Dyn'

export interface CenterProps {
  withTumor?: (tumor_and_gridArea: string, side: 'left' | 'right') => React.ReactNode
  dyn?: Dyn
}

export function Center({withTumor}: CenterProps) {
  const [rects, set_rects] = React.useState(
    {} as Record<string, {width: number; height: number; top: number; left: number}>
  )
  const [ref, set_ref] = React.useState(undefined as any)
  const update_rects = (d: HTMLElement) => {
    const next = Object.fromEntries(
      Array.from(d.parentElement!.querySelectorAll('[id]')).map(e => {
        const {width, height, top, left} = e.getBoundingClientRect()
        return [
          e.id,
          utils.traverse({width, height, top, left}, d =>
            typeof d === 'number' ? Math.round(d) : d
          ),
        ]
      })
    )
    // console.log(next)
    if (!utils.equal(next, rects)) {
      set_rects(next)
    }
  }

  React.useEffect(() => {
    // could be debounced
    ref && update_rects(ref)
  })

  const dyn = useDyn()

  return (
    <div
      id="center"
      css={css`
        margin: 0 auto;
        display: grid;
        grid-template-areas: ${template.trim()};
        grid-template-rows: repeat(${grid.length}, ${dyn('organ sep', 100, 70, 110) + 2}px);
        grid-template-columns:
          150px
          ${dyn('width', 75)}px
          min-content
          ${dyn('width', 75)}px
          150px;
        align-items: center;
      `}
      ref={set_ref}>
      <Svg
        id="bodies"
        css={css`
          grid-area: bodies;
          margin: 0 10px ${dyn('bodies offset', 275, 0, 500)}px;
          justify-self: center;
        `}
      />
      {[...left_organs, ...right_organs].map(organ => (
        <Svg
          id={organ}
          key={organ}
          css={css`
            grid-area: ${organ};
            z-index: 1;
            margin-top: 10px;
            justify-self: ${left_organs.includes(organ) ? 'start' : 'end'};
          `}
        />
      ))}
      {withTumor && left_tumors.map(t => withTumor(t, 'left'))}
      {withTumor && right_tumors.map(t => withTumor(t, 'right'))}
      <svg
        key="svg"
        css={css`
          height: 100%;
          width: 100%;
          grid-area: 1 / 1 / -1 / -1;
        `}>
        {positions.map(({id, bodies, organ, lower}, i) => {
          if (rects.bodies && rects[id] && rects.center) {
            const weight: Record<string, number> = {
              lungs: 1,
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
            const sy = bodies.y * rects.bodies.height - rects.center.top + rects.bodies.top
            const tx = organ.x * rects[id].width - rects.center.left + rects[id].left
            const ty = organ.y * rects[id].height - rects.center.top + rects[id].top
            const w = weight[id]
            const hx = (tx + w * sx) / (w + 1) + (lower ? -dyn('stomach wiggle', 10, 0, 20) : 0)
            const hy = (ty + sy) / 2
            let d = `M${sx} ${sy} Q${hx} ${sy} ${hx} ${hy} T${tx} ${ty}`
            if (id === 'lungs' && Math.abs(sy - ty) < 3) {
              d = `M${sx} ${ty} L${tx} ${ty}`
            }
            if (id === 'skin') {
              const w = 0.2
              const hx = (tx + sx) / 2
              const hy = (ty + w * sy) / (w + 1)
              d = `M${sx} ${sy} Q${sx} ${hy} ${hx} ${hy} T${tx} ${ty}`
            }
            return <path key={i} d={d} stroke="black" fill="transparent" />
          }
        })}
      </svg>
    </div>
  )
}

import stories from '@app/ui_utils/stories'

stories(add => {
  add(<Center />).snap()
  add({
    withTumor: (
      <Center
        withTumor={(t, s) => (
          <div
            key={t}
            style={{
              gridArea: t,
              justifySelf: s == 'left' ? 'end' : 'start',
              alignSelf: 'center',
              borderBottom: '2px steelblue solid',
              margin: '40px 8px 0',
            }}>
            {t}
          </div>
        )}
      />
    ),
  }).snap()
})
