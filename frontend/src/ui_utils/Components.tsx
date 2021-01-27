import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as utils from '../utils'
import {dummy_keys} from './div'
import {useAssertConstant} from './useAssertConstant'

export function useMemoComponent(deps: any[], make: () => React.ReactNode): React.ReactElement {
  // for some reason useMemo on "bare" components does not work, have to
  // wrap them in a ReactFragment
  return React.useMemo(() => <> {make()} </>, deps)
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
    node: dummy_keys(Object.values(xs).map((x: any) => x.node)),
    nodes: utils.mapObject(xs, x => x.node),
  }
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
