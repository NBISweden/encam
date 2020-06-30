export * from './ui_utils/useRoutedTabs'
export * from './ui_utils/div'
import {dummy_keys} from './ui_utils/div'
// export * from './ui_utils/incubator'

import * as React from 'react'
import * as utils from './utils'

export type OnChangeSecondArgument<T> = (_: any, t: T) => void

export interface Store<S> {
  get(): S
  update(s: Partial<S>): void
  at<K extends keyof S, T>(
    k: K,
    f?: (t: T, s: S) => Partial<S>
  ): {
    value: S[K]
    checked: S[K]
    onChange: OnChangeSecondArgument<T>
  }
}

export function useStore<S>(init: S | (() => S)) {
  const [state, update_state] = useStateWithUpdate(init)
  const store: Store<S> = {
    get: () => state,
    update: update_state,
    at(k, f) {
      return {
        value: state[k],
        checked: state[k],
        onChange(_, t) {
          if (f) {
            update_state(state => f(t, state))
          } else {
            update_state(({[k]: t} as any) as Partial<S>)
          }
        },
      }
    },
  }
  return [store, state, update_state] as const
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

export function container() {
  const children: JSX.Element[] = []
  function add<A>([a, x]: readonly [A, JSX.Element, ...any[]]) {
    children.push(x)
    return a
  }
  function wrap<A, Args extends any[]>(f: (...args: Args) => readonly [A, JSX.Element, ...any[]]) {
    return (...args: Args) => add(f(...args))
  }
  return {
    add,
    wrap,
    collect: () => dummy_keys(children),
    addCheckbox: wrap(useCheckbox),
    addCheckboxes: wrap(useCheckboxes),
    addRadio: wrap(useRadio),
  }
}

export function useCheckboxes(labels: string[], init?: Record<string, boolean>) {
  const init_value = init === undefined ? {} : init
  const [value, set_value] = React.useState(init_value)
  React.useLayoutEffect(() => {
    if (value !== init_value) {
      set_value(init_value)
    }
  }, [utils.str(labels)])
  return [
    value,
    <>
      {labels.map(label => (
        <FormControlLabel
          label={label}
          key={label}
          checked={value[label] || false}
          onChange={(e, checked) => {
            const ev = e.nativeEvent as MouseEvent
            if (ev.ctrlKey || ev.shiftKey || ev.altKey) {
              const only_me = utils.selected(value).every((x, i) => i == 0 && x == label)
              if (only_me) {
                set_value(Object.fromEntries(labels.map(v => [v, true])))
              } else {
                set_value({[label]: true})
              }
            } else {
              set_value(v => ({...v, [label]: checked}))
            }
          }}
          control={<Checkbox size="small" color="primary" />}
        />
      ))}
    </>,
    set_value,
  ] as const
}

export function useRadio<K extends string>(label: string, options: K[], init?: K) {
  const [value, set_value] = React.useState(init === undefined ? options[0] : init)
  return [
    value,
    <FormControl component="fieldset">
      <FormLabel component="legend">{label}</FormLabel>
      <RadioGroup value={value} onChange={(_, value) => set_value(value as K)}>
        {options.map(option => (
          <FormControlLabel
            label={option}
            value={option}
            key={option}
            control={<Radio size="small" color="primary" />}
          />
        ))}
      </RadioGroup>
    </FormControl>,
    set_value,
  ] as const
}

export function useCheckbox(label: string, init?: boolean) {
  const [value, set_value] = React.useState(init === undefined ? true : init)
  return [
    value,
    React.useMemo(
      () => (
        <FormControlLabel
          label={label}
          key={label}
          checked={value}
          onChange={(_, checked) => set_value(checked)}
          control={<Checkbox size="small" color="primary" />}
        />
      ),
      [value]
    ),
    set_value,
  ] as const
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

import {Paper as MuiPaper, PaperProps} from '@material-ui/core'

import {styled} from '@material-ui/core/styles'

const ElevatedPaper = (props?: PaperProps) => <MuiPaper elevation={2} {...props} />

export const Paper = styled(ElevatedPaper)({
  margin: 20,
  padding: 20,
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

export function useRecord() {
  useEventListener('click', e => {
    let p = e.target as HTMLElement | null
    let hits: HTMLElement[] = []
    while (p) {
      hits =
        p.tagName == 'LABEL' || p.tagName == 'BUTTON'
          ? [p]
          : Array.from(p.querySelectorAll('label'))
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

export function useStateWithUpdate<State>(init: State | (() => State)) {
  const [state, set_state] = React.useState(init)
  const update_state = (next: Partial<State> | ((s: State) => Partial<State>)) =>
    set_state(now => ({...now, ...(typeof next === 'function' ? next(now) : next)} as any))
  const res: [typeof state, typeof update_state] = [state, update_state]
  return res
}

export const flex_column: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
}

export const flex_row: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
}
