/**

  Utils to make it nicer to work with React, user interactivity or the DOM.

*/
export * from './useRoutedTabs'
export * from './div'
import {dummy_keys} from './div'

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as utils from '../utils'

export function useAssertConstant(...initials: any[]) {
  if (process.env.NODE_ENV === 'development') {
    for (const initial of initials) {
      const {current} = React.useRef(initial)
      if (current !== initial) {
        throw new Error(`Assertion failed, value not constant: ${initial} !== ${current}`)
      }
    }
  }
}

export type Setter<A> = (next: A) => void

export interface Component<A> {
  value: A
  set: Setter<A>
  node: React.ReactNode
}

export function mapComponent<A, B>(
  a: Component<A>,
  to_b: (a: A) => B,
  to_a: (b: B) => A
): Component<B> {
  return {
    value: to_b(a.value),
    set: b => a.set(to_a(b)),
    node: a.node,
  }
}

export function mapComponentNode<A>(
  c: Component<A>,
  f: (n: React.ReactNode) => React.ReactNode
): Component<A> {
  return {
    ...c,
    node: f(c.node),
  }
}

export interface StateWithPartialSetter<A> {
  value: A
  set: Setter<Partial<A>>
}

export type RecordOf<A> = A extends Record<any, infer R> ? R : never

export function merge<A extends Record<keyof A, any>>(
  xs: {[K in keyof A]: Component<A[K]>}
): Component<A> & {
  set: Setter<Partial<A>>
  nodes: Record<keyof A, React.ReactNode>
  values: RecordOf<A>[]
} {
  return {
    value: utils.mapObject(xs, x => x.value),
    values: Object.values(xs).map((x: any) => x.value),
    set: (m: any) =>
      ReactDOM.unstable_batchedUpdates(() => {
        for (const [k, v] of Object.entries(m)) {
          xs[k as keyof A].set(v as A[keyof A])
        }
      }),
    node: <> {Object.values(xs).map((x: any) => x.node)} </>,
    nodes: utils.mapObject(xs, x => x.node),
  }
}

export function useIntern<A>(a: A): A {
  return React.useMemo(() => a, [utils.str(a)])
}

import {
  Checkbox,
  FormControlLabel,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
} from '@material-ui/core'

import NativeSelect from '@material-ui/core/NativeSelect'
import InputLabel from '@material-ui/core/InputLabel'

export function useNativeSelect(
  labels: string[],
  init_value?: string,
  label?: string
): Component<string> {
  const [value, set] = React.useState(init_value ?? labels[0])
  useAssertConstant(labels.toString(), label)
  return {
    value,
    set,
    node: useMemoComponent([value], () => (
      <FormControl>
        <InputLabel shrink htmlFor={label}>
          {label}
        </InputLabel>
        <NativeSelect
          value={value}
          onChange={e => set(e.target.value)}
          inputProps={{
            name: 'age',
            id: label,
          }}>
          {labels.map(label => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </FormControl>
    )),
  }
}

export function useMemoComponent(deps: any[], make: () => React.ReactNode): React.ReactElement {
  // for some reason useMemo on "bare" components does not work, have to wrap them in a ReactFragment
  return React.useMemo(() => <> {make()} </>, deps)
}

export function useRadio<K extends string>(
  label: string,
  options: K[],
  init_value?: K
): Component<K> {
  const [value, set] = React.useState(init_value ?? options[0])
  useAssertConstant(label, options.toString())
  return {
    value,
    set,
    node: useMemoComponent([value], () => (
      <FormControl component="div" role="group">
        <FormLabel component="label">{label}</FormLabel>
        <RadioGroup value={value} onChange={(_, value) => set(value as K)}>
          {options.map(option => (
            <FormControlLabel
              label={option}
              value={option}
              key={option}
              control={<Radio size="small" color="primary" />}
            />
          ))}
        </RadioGroup>
      </FormControl>
    )),
  }
}

export function useCheckbox(label: string, init?: boolean): Component<boolean> {
  const [value, set] = React.useState(init === undefined ? true : init)
  return {
    value,
    set,
    node: useMemoComponent([value], () => (
      <FormControlLabel
        label={label}
        key={label}
        checked={value}
        onChange={(_, checked) => set(checked)}
        control={<Checkbox size="small" color="primary" />}
      />
    )),
  }
}

declare const process: {env: {NODE_ENV: string}}
export function useWhyChanged(name_or_fun: string | Function, props: Record<string, any>) {
  if (process.env.NODE_ENV === 'development') {
    const name = typeof name_or_fun === 'function' ? name_or_fun.name : name_or_fun
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
  const [timer, set_timer] = React.useState(undefined as undefined | ReturnType<typeof setTimeout>)
  const [res, set_res] = React.useState(undefined)
  React.useEffect(() => {
    if (timer !== undefined) {
      clearTimeout(timer)
    }
    const new_timer = setTimeout(() => set_res(k()), ms)
    set_timer(new_timer)
    return () => clearTimeout(new_timer)
  }, [ms, k])
  return res
}

export function useDelayed<A>(ms: number, init_value: A): [A, Setter<A>] {
  const [inter, set_inter] = React.useState(init_value)
  const [value, set_value] = React.useState(init_value)
  useDebounce(
    ms,
    React.useCallback(() => set_value(inter), [inter])
  )
  return [value, set_inter]
}

import {Paper as MuiPaper, PaperProps} from '@material-ui/core'

import {styled} from '@material-ui/core/styles'

const ElevatedPaper = (props?: PaperProps) => <MuiPaper elevation={2} {...props} />

export const Paper = styled(ElevatedPaper)({
  margin: 12,
  padding: 12,
})

export const InlinePaper = styled(Paper)({
  display: 'inline-flex',
  flexDirection: 'row',
})

export function useEventListener<K extends keyof WindowEventMap>(
  type: K,
  listener: (this: Window, ev: WindowEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions,
  deps?: React.DependencyList
) {
  React.useEffect(() => {
    window.addEventListener(type, listener, options)
    return () => window.removeEventListener(type, listener)
  }, deps)
}

export const useKeydown = (h: (e: KeyboardEvent) => void, deps?: React.DependencyList) =>
  useEventListener('keydown', h, undefined, deps)

export function useStateWithUpdate<State>(init: State | (() => State)) {
  const [state, set_state] = React.useState(init)
  const update_state = (next: Partial<State> | ((s: State) => Partial<State>)) =>
    set_state(now => ({...now, ...(typeof next === 'function' ? next(now) : next)} as any))
  const res: [typeof state, typeof update_state] = [state, update_state]
  return res
}

export const flex_column = {
  display: 'flex',
  flexDirection: 'column',
} as const

export const flex_row = {
  display: 'flex',
  flexDirection: 'row',
} as const

export function useAsync(p: () => Promise<any>, deps?: React.DependencyList) {
  return React.useEffect(() => {
    p()
  }, deps)
}

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export interface Channel<M> {
  send(m: M): void
  on(k: (m: M) => void, deps?: React.DependencyList): void
}

export function useChannel<M>(): Channel<M> {
  const listeners = React.useRef([] as ((m: M) => void)[])
  return {
    send(m) {
      listeners.current.forEach(k => k(m))
    },
    on(k, deps = []) {
      const k_cb = React.useCallback(k, deps)
      React.useEffect(() => {
        listeners.current.push(k_cb)
        return () => {
          listeners.current = listeners.current.filter(h => h != k_cb)
        }
      }, [k])
    },
  }
}

export function createGlobalState<S = any>(initialState: S) {
  // Public domain code from
  // https://github.com/streamich/react-use/blob/master/src/createGlobalState.ts
  const store: {state: S; setState: (state: S) => void; setters: any[]} = {
    state: initialState,
    setState(state: S) {
      store.state = state
      store.setters.forEach(setter => setter(store.state))
    },
    setters: [],
  }

  return (): [S, (state: S) => void] => {
    const [globalState, stateSetter] = React.useState<S>(store.state)

    React.useEffect(
      () => () => {
        store.setters = store.setters.filter(setter => setter !== stateSetter)
      },
      []
    )

    React.useLayoutEffect(() => {
      if (!store.setters.includes(stateSetter)) {
        store.setters.push(stateSetter)
      }
    })

    return [globalState, store.setState]
  }
}
