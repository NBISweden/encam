/**

  Utils to make it nicer to work with React, user interactivity or the DOM.

*/
export * from './useRoutedTabs'
export * from './div'
export * from './useAssertConstant'
export * from './Components'

import {Setter} from './Components'

import {dummy_keys} from './div'

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as utils from '../utils'

export function useIntern<A>(a: A): A {
  return React.useMemo(() => a, [utils.str(a)])
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
