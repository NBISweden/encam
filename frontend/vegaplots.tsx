import * as React from 'react'
import * as VL from 'vega-lite'
import * as V from 'vega'

import * as stripes from './stripes'

import * as utils from './utils'

import * as domplots from './domplots'

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

function Embed({ spec, data }: { spec: VL.TopLevelSpec, data?: any[] }): React.ReactElement {
  const [el, set_el] = React.useState(null as HTMLElement | null)
  const runtime: V.Runtime = memo(spec, () => {
    return V.parse(VL.compile(spec).spec)
  })
  utils.useWhyChanged('vp.Embed', {spec, data, el, runtime})
  React.useEffect(() =>
    {
      if (el) {
        // console.time('plot')
        const view = new V.View(runtime)
        data && view.data('data', data)
        view.logLevel(V.None)
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
  return <>
    <div ref={set_el}/>
    <TooltipCSS/>
  </>
}

function embed(spec: VL.TopLevelSpec, data?: any[]): React.ReactElement {
  return <Embed spec={spec} data={data}/>
}

export interface Options<K> {
  inner: K | K[]
  facet: K | K[]
  split: K | K[]
  color: K | K[]
  stripes: K
  landscape: boolean
  legend: boolean
  inner_axis: boolean
  scale: {type: 'linear' | 'semilog'} | {type: 'pow', exponent: number}
  mode: 'default' | 'min-max' | 'outliers'
  show_mean: boolean
}

const default_options: Options<string> = {
  inner: 'location',
  facet: 'tumor',
  split: [],
  color: 'cell',
  stripes: 'location',
  landscape: true,
  legend: true,
  scale: {
    type: 'pow',
    exponent: 0.25,
  },
  inner_axis: false,
  mode: 'default',
  show_mean: false,
}

function orient(options: Options<any>) {
  if (options.landscape) {
    return {
      row: 'row',
      column: 'column',
      x: 'x',
      y: 'y',
      x2: 'x2',
      y2: 'y2',
      height: 'height',
      width: 'width',
    }
  } else {
    return {
      row: 'column',
      column: 'row',
      x: 'y',
      y: 'x',
      x2: 'y2',
      y2: 'x2',
      height: 'width',
      width: 'height',
    }
  }
}

export const PrecalcBoxplot = React.memo(
  function PrecalcBoxplot<K extends string, Row extends Record<K, any> & Precalc>({data, options}: {data: Row[], options?: Partial<Options<K>>}) {
    utils.useWhyChanged('vp.PrecalcBoxplot', {data, options})
    return precalc_boxplot(data, options)
  }
)

function ensure_array<A>(x: A | A[]): A[] {
  return Array.isArray(x) ? x : x === undefined ? [] : [x]
}

export interface Precalc {
  mean: number
  median: number
  q1: number
  q3: number
  upper: number
  lower: number
  min: number
  max: number
}

function precalc_boxplot<K extends string, Row extends Record<K, any> & Precalc>(data0: Row[], opts?: Partial<Options<K>>): React.ReactElement {

  const data = data0.map(x => ({...x} as Record<string, any>))

  const options = { ...default_options, ...opts }

  const { column, row, height, width, x, y, y2 } = orient(options)

  let scale
  if (options.scale) {
    if (options.scale.type == 'pow') {
      scale = {type: 'pow', exponent: options.scale.exponent}
    } else if (options.scale.type == 'semilog') {
      scale = {type: 'semilog'}
    }
  }

  data.map(datum => {
    datum.fill = datum[options.stripes] == 'STROMA' ? 'url(#stripe)' : '#fff0'
    datum.cell_color = domplots.cell_color(datum.cell) // [options.color])
    datum.location_lowercase = datum.location.toLowerCase()

    // put stroma after tumor
    datum.location = datum.location == 'STROMA' ? 1 : 0
  })

  const prepare_option = (xs: string | string[], sep=',') => {
    const array = ensure_array(xs)
    const key = array.join(',')
    if (array.length) {
      data.forEach(datum => {
        datum[key] = array.map(field => datum[field]).join(sep)
      })
    }
    return key
  }

  const inner = prepare_option(options.inner as string | string[])
  const facet = prepare_option(options.facet as string | string[])
  const split = prepare_option(options.split as string | string[])
  const color = prepare_option(options.color as string | string[], ' ')

  const size = 8

  const tooltip = [
    { field: 'cell',
      type: 'nominative',
      title: 'Cell type'
    },
    { field: 'group',
      type: 'nominative',
      title: 'Group'
    },
    { field: 'tumor',
      type: 'nominative',
      title: 'Tumor type'
    },
    { field: 'location_lowercase',
      type: 'nominative',
      title: 'Location'
    },
    { field: 'max',
      type: 'quantitative', format: '.1f',
      title: 'Max'
    },
    { field: 'upper_outliers',
      type: 'quantitative', format: '.1f',
      title: 'Upper outlier count'
    },
    { field: 'q3',
      type: 'quantitative', format: '.1f',
      title: 'Q3'
    },
    { field: 'mean',
      type: 'quantitative', format: '.1f',
      title: 'Mean',
    },
    { field: 'median',
      type: 'quantitative', format: '.1f',
      title: 'Median'
    },
    { field: 'q1',
      type: 'quantitative', format: '.1f',
      title: 'Q1'
    },
    { field: 'lower_outliers',
      type: 'quantitative', format: '.1f',
      title: 'Lower outlier count'
    },
    { field: 'min',
      type: 'quantitative', format: '.1f',
      title: 'Min'
    }
  ]

  const spec: VL.TopLevelSpec = {
    $schema: "https://vega.github.io/schema/vega-lite/v4.json",
    data: { name: 'data' },
    facet: {
      [column]: {
        field: facet,
        type: "ordinal",
        header: {
          labelAngle:  options.landscape ? -90 : 0,
          labelAlign:  options.landscape ? "right" : "left",
          labelOrient: options.landscape ? "bottom" : undefined,
          title: null,
          // labelExpr: `[
          //   truncate(split(datum.value, ",")[1] || '', 6),
          //   truncate(split(datum.value, ",")[0], 6),
          // ]`,
        },
      },
      ...(split ? {
        [row]: {
          field: split,
          type: "ordinal",
          header: {
            // labelAngle:  options.landscape ? 0 : -45,
            // labelAlign:  options.landscape ? "left" : "right",
            // labelOrient: options.landscape ? undefined : "bottom",
            title: null,
            // labelAnchor: null,
            labelExpr: '""',
          },
        } ,
      } : {})
    },
    spec: {
      [height]: 300,
      [width]: { step: 12 },
      encoding: {
        [x]: {
          field: inner,
          type: 'nominal',
          axis: {
            title: null,
            labelExpr: '',
            tickSize: 0,
          },
        },
        tooltip: tooltip as any,
      },
      layer: [
        { mark: { type: 'rule' },
          encoding: {
            [y]: {
              axis: {title: 'expression'},
              field: options.mode == 'min-max' ? 'min' : 'lower',
              type: 'quantitative',
              scale: scale,
            },
            color: { value: 'black' },
            [y2]: { field: 'q1' },
          }
        },
        { mark: { type: 'rule' },
          encoding: {
            [y]: { field: 'q3', type: 'quantitative' },
            [y2]: { field: options.mode == 'min-max' ? 'max' : 'upper' },
            color: { value: 'black' },
          }
        },
        { mark: { type: 'bar', size },
          encoding: {
            [y]: { field: 'q1', type: 'quantitative' },
            [y2]: { field: 'q3' },
            color: {
              field: color,
              type: 'nominal',
              scale: {scheme: 'tableau10'},
              legend: options.legend ? {} : null,
            },
          }
        },
        { mark: { type: 'bar', size },
          encoding: {
            [y]: { field: 'q1', type: 'quantitative' },
            [y2]: { field: 'q3' },
            fill: { field: 'fill', scale: null, type: 'nominal' },
            stroke: { value: 'black' },
            strokeWidth: { value: 1 },
          }
        },
        { mark: { type: 'tick', size },
          encoding: {
            [y]: { field: 'median', type: 'quantitative' },
            // color: { value: 'white' },
            stroke: { value: 'black' },
            strokeWidth: { value: 1 },
            opacity: { value: 1 },
          }
        },
        ...(options.show_mean ? [{
          mark: {
            type: 'point',
            shape: 'circle',
            // shape: 'M-1 -1 L1 1 M1 -1 L-1 1'
          },
          encoding: {
            [y]: { field: 'mean' },
            stroke: { value: 'black' },
            fill: { value: 'black' },
            size: { value: 10 },
            strokeWidth: { value: 1 },
            opacity: { value: 1 },
          }
        }] : [])
      ]
    },
    config: {
      view: { stroke: "transparent" },
      // axis: { grid: true },
      // axis: { domainWidth: 1 },
      facet: { spacing: 6 },
    },
  }
  return embed(spec, data)
}

