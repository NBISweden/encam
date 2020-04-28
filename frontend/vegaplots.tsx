import * as React from 'react'
import * as VL from 'vega-lite'
import * as V from 'vega'

import * as stripes from './stripes'

import * as utils from './utils'

import * as domplots from './domplots'

function Memoizer<K, V>() {
  const mems = {} as Record<string, V>
  return function memo(k: K, calc: () => V): V {
    const ks = JSON.stringify(k)
    if (!(ks in mems)) {
      mems[ks] = calc()
    }
    return mems[ks]
  }
}

const memo = Memoizer<VL.TopLevelSpec, V.Runtime>()

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
        view.runAsync().then(_ => {
          const svg = el.querySelector('svg')
          if (!svg) return
          svg.innerHTML += `<defs>${stripes.pattern}</defs>`
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
  scale?: {type: 'linear' | 'semilog'} | {type: 'pow', exponent: number}
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
  const spec: VL.TopLevelSpec = {
    $schema: "https://vega.github.io/schema/vega-lite/v4.json",
    // data: { expressions: data },
    data: { name: 'data' },
    facet: {
      [column]: {
        field: facet,
        type: "ordinal",
        header: {
          // labelAngle:  options.landscape ? -90 : 0,
          // labelAlign:  options.landscape ? "right" : "left",
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
          labelAngle:  options.landscape ? 0 : -45,
          labelAlign:  options.landscape ? "left" : "right",
          labelOrient: options.landscape ? undefined : "bottom",
          title: null
        },
      } : undefined,
    },
    spec: {
      [height]: 300,
      [width]: { step: 16 },
      encoding: {
        [x]: {
          field: inner,
          type: "nominal",
          axis: options.inner_axis ? undefined : null,
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
          mark: {
            type: "boxplot",
            outliers: false,
          },
          encoding: {
            color: {
              field: options.color,
              type: "nominal",
              scale: options.color === 'cell'
                ? { range:
                      Object.entries(domplots.colors)
                        .sort(utils.by(pair => pair[0]))
                        .map(pair => pair[1]) }
                : { scheme: 'tableau10' },
              // scale: { scheme: "tableau20" },
              // legend: options.legend ? undefined : null,
            },
          },
        },
        {
          mark: {
            type: "boxplot",
            outliers: false
          },
          encoding: {
            fill: {
              field: 'fill', // options.stripes as string,
              type: "nominal",
              scale: null,
              // scale: { range: ["#fff0", "url(#stripe)"] },
              legend: null,
              // legend: options.legend ? undefined : null,
            },
            tooltip: {
              field: options.color,
              type: 'nominal',
            },
          },
        }
      ],
    },
    config: {
      view: { stroke: "transparent" },
      // axis: { grid: true },
      // axis: { domainWidth: 1 },
      facet: { spacing: 2 },
    },
  }
  return embed(spec, data)
}

