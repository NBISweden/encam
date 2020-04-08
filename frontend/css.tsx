import * as React from 'react'

export function make_class_cache(class_prefix='c') {
  const generated = new Map()
  const lines = [] as string[]

  const id = 'class_cache_' + class_prefix
  const sheet = document.getElementById(id) || document.createElement('style')
  document.head.appendChild(sheet)
  sheet.id = id

  const update = () => { sheet.innerHTML = lines.join('\n') }
  update()

  function generate_class(raw_code: string) {
    const key = raw_code
    if (!generated.has(key)) {
      const code = raw_code
        .trim()
        .replace(/\/\/.*/g, '')
        .replace(/\S*:/g, g => ';' + g)
        .replace(/^\s*;+/, '')
        .replace(/\s*;+/g, ';')
        .replace(/\n\s*/g, '\n')
        .replace(/\n}/g, '}')
        .replace(/[:{;][;]?\s*/g, g => g[0])
      const name = class_prefix + generated.size
      generated.set(key, name)
      if (-1 == code.search('{')) {
        lines.push(`.${name} {${code}}`)
      } else {
        lines.push(code.replace(/&/g, _ => `.${name}`))
      }
      update()
    }
    return {'className': generated.get(key)}
  }

  function css(xs: TemplateStringsArray | string, ...more: string[]) {
    let code: string
    if (typeof xs == 'string') {
      code = xs
    } else {
      code = xs.map((s, i) => s + (more[i] === undefined ? '' : more[i])).join('')
    }
    return generate_class(code)
  }

  return {
    css,
    generate_class,
    clear: () => {
      lines.splice(0, lines.length)
      generated.clear()
      update()
    },
  }
}

export const {css, clear} = make_class_cache()

type DivProps = {key?: string} & {css?: string} & React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>

export function div(...args: (DivProps | React.ReactNode)[]) {
  const props: Record<string, any> = {
    children: [],
  }
  args.forEach(function add(arg) {
    if (typeof arg == 'string' || typeof arg == 'number') {
      props.children.push(arg)
    } else if (arg && typeof arg == 'object') {
      if ('$$typeof' in arg) {
        // automatically add keys if they are missing to make React shut up ':D
        let child = arg as any
        if (!child.key) {
          const key = ':' + props.children.length
          const ref = child.ref
          child = React.createElement(child.type, {key, ref, ...child.props})
        }
        props.children.push(child)
      } else if (Array.isArray(arg)) {
        arg.forEach(add)
      } else {
        Object.entries(arg).forEach(([k, v]) => {
          if (k == 'children') {
            props.children.push(...v)
            return
          }
          if (typeof v == 'function') {
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
  return React.createElement('div', props)
}

