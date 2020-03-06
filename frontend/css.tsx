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
      const code = raw_code.trim().replace(/\n\s*/g, '\n').replace(/[:{;]\s*/g, g => g[0])
      const name = class_prefix + generated.size
      generated.set(key, name)
      if (-1 == code.search('{')) {
        lines.push(`.${name} {${code}}`)
      } else {
        lines.push(code.replace(/&/g, _ => `.${name}`))
      }
    }
    update()
    return {'className': generated.get(key)}
  }

  function css(xs: TemplateStringsArray | string, ...more: string[]) {
    let code: string = ''
    if (typeof xs == 'string') {
      code = xs
    } else if (typeof xs != 'string') {
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

type DivProps = {key?: string} & {css?: string} & React.HTMLAttributes<HTMLDivElement>

export function Div(props: DivProps) {
  let className = props.className
  if (props.css) {
    console.log(''.split(' '))
    console.log({a: className || '', b: ''.split(' ')})
    const prev = className ? className.split(' ') : []
    console.log(props.className, prev)
    className = [css(props.css).className, ...prev].join(' ')
  }
  const {css: _, ...props2} = {...props, className}
  return <div {...props2}>{props.children}</div>
}

export function div(...args: (DivProps | React.ReactNode)[]) {
  const props: DivProps = {
    children: []
  }
  for (const arg of args) {
    if (arg && typeof arg === 'object') {
      if (arg['$$typeof']) {
        props.children.push(arg)
      } else {
        Object.entries(arg).forEach(([k, v]) => {
          if (k == 'children') {
            props.children.push(...v)
            return
          }
          if (typeof v == 'object') {
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
  }
  return React.createElement('div', props)
}
