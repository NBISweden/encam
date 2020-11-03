import * as React from 'react'
import * as ui from '../ui_utils'
import * as utils from '../utils'

import {Slider} from '@material-ui/core'

export interface Dyn {
  (id: string, default_value: number, lo?: number, hi?: number): number
}

const dyn0: Dyn = (_, def) => def

const DynCtx = React.createContext(dyn0)

export const useDyn = () => React.useContext(DynCtx)

export function Dyn({children}: {children: React.ReactNode}) {
  const [dyn_vals, set_dyn_vals] = ui.useStateWithUpdate(
    {} as Record<string, {val: number; lo: number; hi: number}>
  )
  const [visible, set_visible] = React.useState(true)
  const q = React.useRef({} as typeof dyn_vals)
  const components = (
    <div
      style={{
        position: 'fixed',
        left: 0,
        bottom: 0,
        width: 280,
        background: '#fff8',
        padding: '20px 40px',
        border: '1px #333a solid',
        borderRadius: 5,
        backdropFilter: 'blur(2px)',
        boxShadow: '2px 4px 4px -4px #333',
        margin: 5,
        zIndex: 998,
        transform: `translate(${visible ? 0 : 'calc(30px - 100%)'}, 0)`,
        transition: 'transform 300ms ease',
      }}
      onDoubleClick={() => set_visible(b => !b)}>
      {Object.entries(dyn_vals)
        .sort(utils.by(([k]) => k))
        .map(([k, {val, lo, hi}]) => (
          <div key={k} style={{height: 58}}>
            <label style={{position: 'relative', top: 12, zIndex: 1000, color: '#444'}}>
              {k + ':'}
            </label>
            <Slider
              style={{zIndex: 999}}
              min={lo}
              max={hi}
              step={(hi - lo) / 100}
              value={val}
              onChange={(_, val) => {
                !Array.isArray(val) && set_dyn_vals({[k]: {val, lo, hi}})
              }}
              valueLabelDisplay="on"
              valueLabelFormat={(s: number) =>
                ('' + utils.roundDown(s, 3)).replace(/\..*/, s => s.slice(0, 3))
              }
            />
          </div>
        ))}
    </div>
  )

  const dyn = (label: string, def: number, lo = def / 3, hi = 3 * def) => {
    if (label in dyn_vals && dyn_vals[label].lo === lo && dyn_vals[label].hi === hi) {
      return dyn_vals[label].val
    } else {
      if (Object.keys(q.current).length == 0) {
        window.requestAnimationFrame(() => {
          set_dyn_vals(q.current)
          q.current = {}
        })
      }
      q.current[label] = {val: def, lo, hi}
      return def
    }
  }

  return (
    <DynCtx.Provider value={dyn}>
      {components}
      {children}
    </DynCtx.Provider>
  )
}
