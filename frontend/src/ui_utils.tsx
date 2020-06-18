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

type Arg0<T> = T extends (a: infer A) => any ? A : never

type WithCss<A> = (props: Arg0<A> & {css?: string}) => JSX.Element

import {Paper as MuiPaper} from '@material-ui/core'

export const Paper = styled(MuiPaper as WithCss<typeof MuiPaper>).attrs(() => ({
  // variant: 'outlined',
  elevation: 2,
}))`
  margin: 20;
  padding: 20;
  ${props => props.css || ''}
`

export const InlinePaper = (props: Arg0<typeof MuiPaper> ) =>
  <Paper css="display: inline-flex; flex-direction: row" {...props}/>

export function useEventListener<K extends keyof WindowEventMap>(type: K, listener: (this: Window, ev: WindowEventMap[K]) => any, options?: boolean | AddEventListenerOptions) {
  React.useEffect(() => {
    window.addEventListener(type, listener, options)
    return () => window.removeEventListener(type, listener)
  }, [])
}

export const useKeydown = (h: (e: KeyboardEvent) => void) => useEventListener('keydown', h)

export function useRecord() {
  useEventListener('click', e => {
    let p = e.target as HTMLElement | null
    let hits: HTMLElement[] = []
    while (p) {
      hits = p.tagName == 'LABEL' || p.tagName == 'BUTTON' ? [p] : Array.from(p.querySelectorAll('label'))
      if (hits.length > 0) break
      p = p.parentElement
    }
    if (hits.length == 1) {
      console.log(hits[0].innerText)
    } else if (hits.length > 1) {
      console.warn('Multiple hits:', hits.map(i => i.innerText).join(', '))
    }
  })
}

export function dummy_keys(xs: React.ReactNode[], prefix=';'): React.ReactNode[] {
  return xs.map((x, i) => {
    if (x && typeof x == 'object' && '$$typeof' in x) {
      let child = x as any
      if (!child.key) {
        const key = prefix + i
        const ref = child.ref
        child = React.createElement(child.type, {key, ref, ...child.props})
      }
      return child
    } else {
      return x
    }
  })
}

export function css(xs: TemplateStringsArray | string, ...more: string[]): {css: string} {
  let css: string
  if (typeof xs == 'string') {
    css = xs
  } else {
    css = xs.map((s, i) => s + (more[i] === undefined ? '' : more[i])).join('')
  }
  return {css}
}

export type DivProps = {key?: string} & {css?: string} & React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>

const Div = styled.div`${(props: any) => props.css}`

export function div(...args: (DivProps | {css: string} | React.ReactNode)[]) {
  const props: Record<string, any> = {
    children: [],
    css: '',
  }
  args.forEach(function add(arg) {
    if (typeof arg == 'string' || typeof arg == 'number') {
      props.children.push(arg)
    } else if (arg && typeof arg == 'object') {
      if ('$$typeof' in arg) {
        props.children.push(arg)
      } else if (Array.isArray(arg)) {
        arg.forEach(add)
      } else {
        Object.entries(arg).forEach(([k, v]) => {
          if (k == 'css') {
            props.css += ';\n' + v
          } else if (k == 'children') {
            props.children.push(...v)
          } else if (typeof v == 'function') {
            const prev = props[k]
            if (prev) {
              props[k] = (...args: any[]) => {
                prev(...args)
                v(...args)
              }
            } else {
              props[k] = v
            }
          } else if (typeof v == 'object') {
            props[k] = {...props[k], ...v}
          } else {
            if (props[k]) {
              props[k] += ' '
            } else {
              props[k] = ''
            }
            props[k] += v
          }
        })
      }
    }
  })
  props.children = dummy_keys(props.children, ':')
  return React.createElement(Div, props)
}
