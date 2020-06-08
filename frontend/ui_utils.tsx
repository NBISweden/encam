import * as React from 'react'
import * as utils from './utils'

export function useCheckboxes(labels: string[], init?: Record<string, boolean>): [Record<string, boolean>, React.ReactElement, (v: Record<string, boolean>) => void] {
  const [value, set_value] = React.useState(init === undefined ? {} : init)
  return [
    value,
    <>
      {labels.map(label =>
        <FormControlLabel
          label={label}
          key={label}
          checked={value[label] || false}
          onChange={(e, checked) => {
            const ev = e.nativeEvent as MouseEvent
            if (ev.ctrlKey || ev.shiftKey || ev.altKey) {
              const only_me = utils.selected(value).every((x, i) => i == 0 && x == label)
              if (only_me) {
                set_value(utils.mapObject(value, () => true))
              } else {
                set_value(utils.mapObject(value, (_, x) => x == label))
              }
            } else {
              set_value(v => ({...v, [label]: checked}))
            }
          }}
          control={<Checkbox size="small" color="primary"/>}
        />
      )}
    </>,
    set_value,
  ]
}


export function useRadio<K extends string>(label: string, options: K[], init?: K): [K, React.ReactElement] {
  const [value, set_value] = React.useState(init === undefined ? options[0] : init)
  return [
    value,
    <FormControl component="fieldset">
      <FormLabel component="legend">{label}</FormLabel>
      <RadioGroup value={value} onChange={(_, value) => set_value(value as K)}>
        {options.map(option =>
          <FormControlLabel
            label={option}
            value={option}
            key={option}
            control={<Radio size="small" color="primary"/>}
          />
        )}
      </RadioGroup>
    </FormControl>
  ]
}

import { Checkbox, FormControlLabel, FormControl, FormLabel, RadioGroup, Radio } from '@material-ui/core'

export function useCheckbox(label: string, init?: boolean): [boolean, React.ReactElement] {
  const [value, set_value] = React.useState(init === undefined ? true : init)
  return [
    value,
    React.useMemo(() => <FormControlLabel
      label={label}
      key={label}
      checked={value}
      onChange={(_, checked) => set_value(checked)}
      control={<Checkbox size="small" color="primary"/>}
    />, [value])
  ]
}

declare const process: {env: {NODE_ENV: string}}
export function useWhyChanged(name: string, props: Record<string, any>) {
  if (process.env.NODE_ENV === 'development') {
    const r = React.useRef<Record<string, any>>()
    React.useEffect(() => {
      if (r.current !== undefined) {
        const changed: string[] = []
        for (let k in props) {
          if (!Object.is(r.current[k], props[k])) {
            changed.push(k)
          }
        }
        console.log(`${name}: ${changed.join(', ')} changed`)
      } else {
        console.log(`${name} created`)
      }
      r.current = props || {}
    })
  }
}

export function useDebounce(ms: number, k: Function) {
  const [block, set_block] = React.useState(false)
  const [res, set_res] = React.useState(undefined)
  React.useEffect(() => {
    if (!block) {
      const timer = setTimeout(() => set_block(false), ms)
      set_res(k())
      set_block(true)
      return () => clearTimeout(timer)
    }
  })
  return res
}

import styled from 'styled-components'

type WithCss<A> = A extends (props : infer P) => JSX.Element ? (props: P & {css?: string}) => JSX.Element : never

import {Paper as MuiPaper} from '@material-ui/core'

export const Paper = styled(MuiPaper as WithCss<typeof MuiPaper>).attrs(() => ({
  // variant: 'outlined',
  elevation: 2,
}))`
  margin: 20;
  padding: 20;
  ${props => props.css || ''}
`

export function useEventListener<K extends keyof WindowEventMap>(type: K, listener: (this: Window, ev: WindowEventMap[K]) => any, options?: boolean | AddEventListenerOptions) {
  React.useEffect(() => {
    window.addEventListener(type, listener)
    return () => window.removeEventListener(type, listener)
  }, [])
}

export const useKeydown = (h: (e: KeyboardEvent) => void) => useEventListener('keydown', h)

export function useRecord() {
  useEventListener('click', e => {
    let p = e.target as HTMLElement | null
    const p0 = p
    let hits: Element[] = []
    while (p) {
      hits = p.tagName == 'LABEL' || p.tagName == 'BUTTON' ? [p] : Array.from(p.querySelectorAll('label'))
      if (hits.length > 0) break
      p = p.parentElement
    }
    if (hits.length == 1) {
      console.log(hits[0].innerText)
      // console.log({p0, p, hits})
    } else if (hits.length > 1) {
      console.warn('Multiple hits:', hits.map(i => i.innerText).join(', '))
    }
  })
}
