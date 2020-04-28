import * as React from 'react'
import * as VL from 'vega-lite'
import * as V from 'vega'

import * as stripes from './stripes'

import * as utils from './utils'

import * as domplots from './domplots'

import vegaTooltip from 'vega-tooltip';

function Embed({ spec, data }: { spec: VL.TopLevelSpec, data?: any[] }): React.ReactElement {
  const [el, set_el] = React.useState(null as HTMLElement | null)
  const runtime: V.Runtime = React.useMemo<V.Runtime>(() => V.parse(VL.compile(spec).spec), [spec])
  React.useEffect(() =>
    {
      if (el) {
        const view = new V.View(runtime)
        data && view.data('data', data)
        view.logLevel(V.Warn)
            .renderer('svg')
            .initialize(el)
            .tooltip((...args) => console.log(args))
        vegaTooltip(view)
        view.runAsync().then(_ => {
          const svg = el.querySelector('svg')
          if (!svg) return
          const defs = document.createElementNS(svg.namespaceURI, 'defs')
          defs.innerHTML = stripes.pattern
          svg.append(defs)
        })
      }
    }, [el, runtime])
  return <div ref={set_el} />
}

function embed(spec: VL.TopLevelSpec, data?: any[]): React.ReactElement {
  return <Embed spec={spec} data={data}/>
}

export interface Options<K> {
  inner: K | K[]
  facet: K | K[]
  split: K | K[]
  color: K
  stripes: K
  landscape: boolean
  legend: boolean
  inner_axis: boolean
  scale: {type: 'linear' | 'semilog'} | {type: 'pow', exponent: number}
  mode: 'default' | 'min-max' | 'outliers'
}

const default_options: Options<string> = {
  inner: 'location',
  facet: 'tumor',
  split: [],
  color: 'cell',
  stripes: 'location',
  landscape: true,
  legend: false,
  scale: {
    type: 'pow',
    exponent: 0.25,
  },
  inner_axis: false,
  mode: 'outliers',
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

export function Boxplot<Row extends Record<string, any>>({data, options}: {data: Row[], options?: Partial<Options<K>>}) {
  return boxplot(data, options)
}

function ensure_array<A>(x: A | A[]): A[] {
  return Array.isArray(x) ? x : x === undefined ? [] : [x]
}

function boxplot<K extends string, Row extends Record<K, any>>(data0: Row[], opts?: Partial<Options<K>>): React.ReactElement {
  const data = data0.map(x => ({...x} as Record<string, any>))
  const options = { ...default_options, ...opts }
  const { column, row, height, width, x, y } = orient(options)

  const prepare_option = (xs: string | string[]) => {
    const array = ensure_array(xs)
    const key = array.join(',')
    if (array.length) {
      data.forEach(datum => {
        datum[key] = array.map(field => datum[field]).join(',')
      })
    }
    return key
  }

  const inner = prepare_option(options.inner as string | string[])
  const facet = prepare_option(options.facet as string | string[])
  const split = prepare_option(options.split as string | string[])

  data.forEach(datum => {
    // const url = `url("data:image/svg+xml;base64,${btoa(stripes.patternSVG).replace(/ /g, '')}")`
    const url = 'url(#stripe)'
    datum.fill = datum[options.stripes] == 'STROMA' ? url : '#fff0'
    datum.cell_color = domplots.cell_color(datum.cell) // [options.color])
  })

  let scale
  if (options.scale) {
    if (options.scale.type == 'pow') {
      scale = {type: 'pow', exponent: options.scale.exponent}
    } else if (options.scale.type == 'semilog') {
      scale = {type: 'semilog'}
    }
  }

  const mark = {
    type: "boxplot",
    size: 10,
    outliers: options.mode == 'outliers'
      ? { color: '#fff0' }
      : false,
    extent: options.mode == 'min-max' ? 'min-max' : undefined,
    median: { stroke: '#000', strokeWidth: 1 },
    // ticks: { stroke: '#333', strokeWidth: 1 },
    // tooltip: {
    //   field: facet
    // }
  }

  const spec: VL.TopLevelSpec = {
    $schema: "https://vega.github.io/schema/vega-lite/v4.json",
    // data: { expressions: data },
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
      [row]: split ? {
        field: split,
        type: "ordinal",
        header: {
          // labelAngle:  options.landscape ? 0 : -45,
          // labelAlign:  options.landscape ? "left" : "right",
          // labelOrient: options.landscape ? undefined : "bottom",
          title: null,
        },
      } : undefined,
    },
    spec: {
      [height]: 300,
      [width]: { step: 12 },
      encoding: {
        [x]: {
          field: inner,
          type: "nominal",
          axis: {
            title: null,
            labelExpr: '',
            tickSize: 0,
          },
          // axis: options.inner_axis ? undefined : null,
          header: {
            title: null
          }
        },
        [y]: {
          field: "expression",
          type: "quantitative",
          axis: { title: "expression", grid: false },
          scale
        },
      },
      layer: [
        {
          mark: mark,
          encoding: {
            fill: {
              field: options.color,
              type: "nominal",
              scale: options.color === 'cell'
                ? { range:
                      Object.entries(domplots.colors)
                        .filter(pair => data.some(row => row.cell === pair[0]))
                        .sort(utils.by(pair => pair[0]))
                        .map(pair => pair[1]) }
                : { scheme: 'tableau20' },
              // scale: { scheme: "tableau20" },
              // legend: options.legend ? undefined : null,
            },
          },
        },
        {
          mark,
          encoding: {
            fill: {
              // field: options.stripes as string,
              type: "nominal",
              field: 'fill',
              scale: null,
              // scale: { range: ["#fff0", "url(#stripe)"] },
              legend: null,
              // legend: options.legend ? undefined : null,
            },
          },
        }
      ],
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

