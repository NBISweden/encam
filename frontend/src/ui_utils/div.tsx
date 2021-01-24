/**

  I started the project without React and just using my own dom-diffing library.
  It exported a function `div` which created a div. I ported it to React and
  wired in emotion into it (it used to be styled-components but it was easier
  to combine it with emotion) and it stuck in the code-base since it's occasionally
  convenient to use.

  This code is not strictly necessary and all uses of div could be replaced with jsx.

*/
import * as React from 'react'

import {ClassNames, Interpolation} from '@emotion/core'

export function dummy_keys(xs: React.ReactNode[], prefix = ';'): React.ReactElement {
  return (
    <>
      {xs.map((x, i) => {
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
  )
}

export function css(
  template: TemplateStringsArray | string | Interpolation,
  ...args: Interpolation[]
): {css: unknown} {
  return {css: [template, ...args]}
}

export type DivProps = {key?: string} & {css?: unknown} & React.HTMLAttributes<HTMLDivElement> &
  React.RefAttributes<HTMLDivElement>

export function div(...args: (DivProps | {css: unknown} | React.ReactNode)[]) {
  const props: Record<string, any> = {
    children: [],
    css: [],
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
            props.css.push(v)
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
  const {css: props_css, key, ...normal_props} = props
  if (props_css.length) {
    return (
      <ClassNames key={key}>
        {({css, cx}) => (
          <div
            {...normal_props}
            className={cx(
              normal_props.className,
              props_css.map((xs: any[]) => css(...xs))
            )}
          />
        )}
      </ClassNames>
    )
  } else {
    return <div {...normal_props} key={key} />
  }
}
