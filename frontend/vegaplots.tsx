import * as React from 'react'
import * as VL from 'vega-lite'
import * as V from 'vega'

import * as stripes from './stripes'

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
  if (el) {
    const runtime = memo(spec, () => V.parse(VL.compile(spec).spec))
    const view = new V.View(runtime)
    data && view.data('data', data)
    view.logLevel(V.Warn)
        .renderer('svg')
        .initialize(el)
      // .hover()
    view.runAsync().then(_ => {
      const svg = el.querySelector('svg')
      if (!svg) return
      svg.innerHTML += `<defs>${stripes.pattern}</defs>`
    })
  }
  return <div ref={set_el} />
}

function embed(spec: VL.TopLevelSpec, data?: any[]): React.ReactElement {
  return <Embed spec={spec} data={data}/>
}

const default_options = {
  facet: 'cell' as 'cell' | 'tumor',
  horizontal: true,
  legend: false,
}

type Options = typeof default_options

function orient(options: Options) {
  if (options.horizontal) {
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

export function boxplot(data: any[], opts?: Partial<Options>): React.ReactElement {
  const options = { ...default_options, ...opts }
  const { row, height, x, y } = orient(options)
  const spec: VL.TopLevelSpec = {
    $schema: "https://vega.github.io/schema/vega-lite/v4.json",
    // data: { values: data },
    data: { name: 'data' },
    transform: [
      // {calculate: "pow(datum.value, 4)", as: "value"}
    ],
    facet: {
      [row]: {
        field: 'variable',
        type: "ordinal",
        header: {
          labelAngle: options.horizontal ? 0 : -45,
          labelAlign: options.horizontal ? "left" : "right",
          labelOrient: options.horizontal ? undefined : "bottom",
          title: null
        },
      },
    },
    spec: {
      height: 450,
      [height]: { step: 12 },
      encoding: {
        [x]: {
          field: "value", type: "quantitative",
          axis: { title: "expression", grid: false }
        },
        [y]: {
          field: "Tumor_type_code", type: "nominal",
          axis: null,
        },
        color: {
          field: "Tumor_type_code", type: "nominal",
          scale: { scheme: "tableau20" },
          legend: undefined ,
        }
      },
      layer: [
        {
          mark: {
            type: "boxplot",
            outliers: false
          }
        },
      ],
    },
    config: {
      view: { stroke: "transparent" },
      axis: { domainWidth: 1 },
      facet: { spacing: 5 },
    },
  }
  return embed(spec, data)
}

// horizontal barchart
export function barchart(data: any[] | string, opts?: Partial<Options>): React.ReactElement {
  const options = { ...default_options, ...opts }
  const { row, height, x, y } = orient(options)
  const spec: VL.TopLevelSpec = {
    $schema: "https://vega.github.io/schema/vega-lite/v4.json",
    autosize: {
      resize: true
    },
    // data: { values: data },
    data: typeof data == 'string' ? {url: data} : { name: 'data' },
    facet: {
      [row]: {
        field: options.facet,
        type: "ordinal",
        header: {
          labelAngle: options.horizontal ? 0 : -45,
          labelAlign: options.horizontal ? "left" : "right",
          labelOrient: options.horizontal ? undefined : "bottom",
          title: null
        },
      },
    },
    spec: {
      [height]: { step: 12 },
      encoding: {
        [x]: {
          field: "expression", type: "quantitative",
          axis: { title: "expression", grid: false }
        },
        [y]: {
          field: "location", type: "nominal",
          axis: null,
        },
      },
      layer: [
        {
          mark: "bar",
          encoding: {
            color: {
              field: "cell", type: "nominal",
              scale: { scheme: "tableau20" },
              legend: options.legend ? undefined : null,
            }
          },
        },
        {
          mark: "bar",
          encoding: {
            fill: {
              field: "location", type: "nominal",
              scale: { range: ["#fff0", "url(#stripe)"] },
              legend: options.legend ? undefined : null,
            }
          },
        }
      ],
    },
    config: {
      view: { stroke: "transparent" },
      axis: { domainWidth: 1 },
      facet: { spacing: 5 },
    }
  }
  return embed(spec, typeof data == 'string' ? undefined : data)
}

export function forest(data: any[], opts?: Partial<Options>): React.ReactElement {
  const options = { ...default_options, ...opts }
  const { row, height, x, x2, y } = orient(options)
  const spec: VL.TopLevelSpec = {
    $schema: "https://vega.github.io/schema/vega-lite/v4.json",
    data: { name: 'data' },
    facet: {
      [row]: {
        field: options.facet,
        type: "ordinal",
        header: {
          labelAngle: options.horizontal ? 0 : -45,
          labelAlign: options.horizontal ? "left" : "right",
          labelOrient: options.horizontal ? undefined : "bottom",
          title: null
        },
      },
    },
    spec: {
      [height]: { step: 12 },
      encoding: {
        [y]: {
          field: "location", type: "nominal",
          axis: null,
        },
        [x]: {
          field: "lower", type: "quantitative",
          axis: { title: "HR", grid: false }
        },
        [x2]: {
          field: "upper",
        },
        color: {
          field: "cell", type: "nominal",
          scale: { scheme: "tableau20" },
          legend: options.legend ? undefined : null,
        }
      },
      layer: [
        {
          mark: {
            type: "bar",
            size: 2
          },
          encoding: {

          },
        },
        {
          mark: {
            type: "bar",
            size: 2
          },
          encoding: {
            fill: {
              field: "location", type: "nominal",
              scale: { range: ["#fff0", "url(#stripe)"] },
              legend: options.legend ? undefined : null,
            }
          },
        },
        {
          mark: {
            type: "tick",
            thickness: 2,
          },
          encoding: {
            [x]: {
              field: "coef", type: "quantitative",
            },
          },
        },
        {
          mark: {
            type: "tick",
            thickness: 2,
            size: 6,
          },
          encoding: {
            [x]: {
              field: "lower", type: "quantitative",
            },
          },
        },
        {
          mark: {
            type: "tick",
            thickness: 2,
            size: 6,
          },
          encoding: {
            [x]: {
              field: "upper", type: "quantitative",
            },
          },
        }
      ],
    },
    config: {
      view: { stroke: "transparent" },
      axis: { domainWidth: 1 },
      facet: { spacing: 5 },
    }
  }
  return embed(spec, data)
}

