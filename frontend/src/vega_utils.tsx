import * as React from 'react'
import * as VL from 'vega-lite'
import * as V from 'vega'

import * as stripes from './stripes'

import * as utils from './utils'
import * as ui from './ui_utils'

import vegaTooltip from 'vega-tooltip'

import * as sc from 'styled-components'

const TooltipCSS = sc.createGlobalStyle`
  #vg-tooltip-element {
    &, & * {
      font-family: inherit;
    }
    .key, .value {
      font-size: 0.8em;
      text-align: right;
    }
  }
`

const memo = utils.Memoizer<VL.TopLevelSpec, V.Runtime>()

function facet_line_fixup(svg: SVGElement) {
  // Hack to fix facetted axis lines https://github.com/vega/vega-lite/issues/4703
  // console.time('facet fixup')
  const xs = Array.from(svg.querySelectorAll('.mark-rule.role-axis-grid'))
  if (xs.length < 2) {
    return
  }
  const N = xs.length

  const pairs = [
    [0, N - 1],
    [0, N / 2 - 1],
    [N / 2, N - 1],
    [0, N - 2],
    [1, N - 1],
  ]

  const done = {} as Record<number, boolean>

  for (let p = 0; p < pairs.length; ++p) {
    const [j, k] = pairs[p]
    if (done[j] || done[k]) {
      continue
    }
    if (!xs[j] || !xs[k]) {
      continue
    }
    const left = Array.from(xs[j].children)
    const right = Array.from(xs[k].children)
    for (let i = 0; i < left.length && i < right.length; ++i) {
      const L = left[i]
      const R = right[i]
      const L_rect = L.getBoundingClientRect()
      const R_rect = R.getBoundingClientRect()
      if (L_rect.width && L_rect.top == R_rect.top) {
        L.setAttribute('x2', `${R_rect.right - L_rect.left}`)
      } else if (L_rect.height && L_rect.left == R_rect.left) {
        L.setAttribute('y1', `${R_rect.bottom - L_rect.top - L_rect.height}`)
      } else {
        break
      }
      done[j] = done[k] = true
    }
  }
  // console.timeEnd('facet fixup')
}

export function Embed({spec, data}: {spec: VL.TopLevelSpec; data?: any[]}): React.ReactElement {
  const [el, set_el] = React.useState(null as HTMLElement | null)
  const runtime: V.Runtime = memo(spec, () => {
    return V.parse(VL.compile(spec).spec)
  })
  ui.useWhyChanged('vega_utils.Embed', {spec, data, el, runtime})
  React.useEffect(() => {
    if (el) {
      // console.time('plot')
      const view = new V.View(runtime)
      data && view.data('data', data)
      view
        .logLevel(V.None)
        .renderer('svg')
        .initialize(el)
        .tooltip((...args) => console.log(args))
      vegaTooltip(view)
      view.runAsync().then(_ => {
        const svg = el.querySelector('svg')
        if (!svg) return
        facet_line_fixup(svg)
        const defs = document.createElementNS(svg.namespaceURI, 'defs')
        defs.innerHTML = stripes.pattern
        svg.append(defs)
        // console.timeEnd('plot')
      })
    }
  }, [el, runtime, data])
  return (
    <>
      <div ref={set_el} />
      <TooltipCSS />
    </>
  )
}
