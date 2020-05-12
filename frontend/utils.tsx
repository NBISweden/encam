import * as React from 'react'

export function by<A, B>(f: (a: A) => B) {
  return (x: A, y: A) => {
    const fx = f(x)
    const fy = f(y)
    return fx > fy ? 1 : fx == fy ? 0 : -1
  }
}

export function roundDown(x: number): number {
  // Rounds down to one digit precision
  // roundDown(999) => 900
  // roundDown(0.123) => 0.1
  const d = Math.pow(10, Math.floor(Math.log10(x)))
  return Math.floor(x / d) * d
}

export function enumTo(elements: number): number[] {
  const out: number[] = []
  for (let i = 0; i < elements; ++i) {
    out.push(i)
  }
  return out
}

export function groupBy<T extends Record<string, any>>(k: keyof T, rows: T[]): Record<string, T[]> {
  const res: Record<string, T[]> = {}
  rows.forEach(row => {
    const v = row[k]
    res[v] = res[v] || []
    res[v].push(row)
  })
  return res
}

export function identity<A>(a: A): A {
  return a
}

/** Returns a copy of the array with duplicates removed, via reference equality */
export function uniq<A>(xs: A[]): A[] {
  const seen = new Set()
  return xs.filter(x => {
    const duplicate = seen.has(x)
    seen.add(x)
    return !duplicate
  })
}

export type RowRange<A extends Record<string, any>> = {[K in keyof A]: A[K][]}

export function row_range<A extends Record<string, any>>(d: A[]): RowRange<A> {
  const out = {} as any
  for (const k of Object.keys(d[0])) {
    out[k] = uniq(d.map(x => x[k]))
  }
  return out
}

export function pretty(s: string | number) {
  if (typeof s === 'number') {
    return s
  }
  const s2 = s.replace('_', ' ')
  if (s2.toLowerCase() == s2) {
    return s2[0].toUpperCase() + s2.slice(1)
  } else {
    return s2
  }
}

export function expand(d: Record<string, string[]>): Record<string, string[] | Record<string, string[]>> {
  const out = {} as any
  Object.entries(d).forEach(([k, v]) => {
    const m = k.match(/(.*),(.*)/)
    if (m) {
      const [_, k1, k2] = m
      if (!(k1 in out)) {
        out[k1] = {}
      }
      out[k1][k2] = v
    } else {
      out[k] = v
    }
  })
  return out
}

export function selected(d: Record<string, boolean>): string[] {
  return Object.entries(d).filter(([_, v]) => v).map(([k, _]) => k)
}

export function last<A>(N: number, xs: A[]): A[] {
  return xs.reverse().slice(0, N).reverse()
}

export function cap(N: number, d: Record<string, boolean>) {
  return Object.fromEntries(last(N, selected(d)).map(k => [k, true]))
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

export function Memoizer<K, V>() {
  const mems = {} as Record<string, V>
  return function memo(k: K, calc: () => V): V {
    const ks = JSON.stringify(k)
    if (!(ks in mems)) {
      mems[ks] = calc()
      // console.log('memo miss', k)
    } else {
      // console.log('memo hit', k)
    }
    return mems[ks]
  }
}

declare const process: {env: {NODE_ENV: string}}
export function useWhyChanged(name: string, props: Record<string, any>) {
  if (process.env.NODE_ENV === 'development') {
    const r = React.useRef()
    React.useEffect(() => {
      if (r.current !== undefined) {
        const changed: string[] = []
        for (let k in props) {
          if (r.current[k] !== props[k]) {
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

import { Checkbox, FormControlLabel, FormControl, FormLabel, RadioGroup, Radio } from '@material-ui/core'
import { Autocomplete } from '@material-ui/lab'

export function useCheckbox(label: string, init?: boolean): [boolean, React.ReactElement] {
  const [value, set_value] = React.useState(init === undefined ? true : init)
  return [
    value,
    <FormControlLabel
      label={label}
      key={label}
      checked={value}
      onChange={(_, checked) => set_value(checked)}
      control={<Checkbox size="small" color="primary"/>}
    />
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
