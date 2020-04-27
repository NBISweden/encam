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

interface Options<K> {
  inner: K | K[]
  facet: K | K[]
  color: K
  stripes: K
  landscape: true
  legend: false
  scale?: {type: 'linear' | 'semilog'} | {type: 'pow', exponent: number}
}

const default_options: Options<string> = {
  inner: 'location',
  facet: 'tumor',
  color: 'cell',
  stripes: 'location',
  landscape: true,
  legend: false,
  scale: {
    type: 'pow',
    exponent: 0.25,
  }
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
  return Array.isArray(x) ? x : [x]
}

function tap<A>(a: A): A {
  console.log(a)
  return a
}

function boxplot<Row extends Record<string, any>>(data: Row[], opts?: Partial<Options<keyof Row>>): React.ReactElement {
  console.log('new boxplot')
  const options = { ...default_options, ...opts }
  const { column, height, width, x, y } = orient(options)
  const inner = ensure_array(options.inner)
  const facet = ensure_array(options.facet)
  const inner_key = inner.join(',') + '_key'
  const facet_key = facet.join(',') + '_key'
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
    transform: tap([
      // {calculate: "pow(datum.expression, 1/4)", as: "expression"}
      // {calculate: "datum.location + ',' + datum.cell", as: "location,cell"}
      {calculate: inner.map(x => 'datum.' + x).join(" + ',' + "), as: inner_key},
      {calculate: facet.map(x => 'datum.' + x).join(" + ',' + "), as: facet_key},
    ]),
    facet: {
      [column]: {
        field: facet_key,
        type: "ordinal",
        header: {
          labelAngle:  options.landscape ? -45 : 0,
          labelAlign:  options.landscape ? "right" : "left",
          labelOrient: options.landscape ? "bottom" : undefined,
          title: null
        },
      },
    },
    spec: {
      // height: 450,
      // [height]: { step: 12 },
      encoding: {
        [x]: {
          field: inner_key,
          type: "nominal",
          axis: null,
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
            outliers: false
          },
          encoding: {
            color: {
              field: options.color as string,
              type: "nominal",
              scale: { scheme: "tableau20" },
              // legend: options.legend ? undefined : null,
            }
          },
        },
        {
          mark: {
            type: "boxplot",
            outliers: false
          },
          encoding: {
            fill: {
              field: options.stripes as string,
              type: "nominal",
              scale: { range: ["#fff0", "url(#stripe)"] },
              legend: null,
              // legend: options.legend ? undefined : null,
            }
          },
        }
      ],
    },
    config: {
      view: { stroke: "transparent" },
      // axis: { domainWidth: 1 },
      // facet: { spacing: 5 },
    },
  }
  return embed(spec, data)
}

