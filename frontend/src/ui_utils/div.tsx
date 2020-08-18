import * as React from 'react'
import styled from 'styled-components'

export function dummy_keys(xs: React.ReactNode[], prefix = ';'): React.ReactElement {
  return <>
    {
    xs.map((x, i) => {
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
  })}
  </>
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

export type DivProps = {key?: string} & {css?: string} & React.HTMLAttributes<HTMLDivElement> &
  React.RefAttributes<HTMLDivElement>

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
