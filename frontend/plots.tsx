import {CT, Row, range, pretty, uniq} from './db'

import * as React from 'react'
import vegaEmbed, * as VegaEmbed from 'vega-embed'

const stripe_size = 6
const stripe_width = 2

const pattern = `
  <pattern id='stripe' patternUnits='userSpaceOnUse' width='${stripe_size}' height='${stripe_size}'>
    <path d='M-1,1 l2,-2
       M0,${stripe_size} l${stripe_size},-${stripe_size}
       M${stripe_size-1},${stripe_size+1} l2,-2' stroke='white' stroke-width='${stripe_width}'/>
  </pattern>
`

function Embed({spec}: {spec: VegaEmbed.VisualizationSpec}) {
  const [el, set_el] = React.useState(null as HTMLElement | null)
  if (el) {
    vegaEmbed(el, spec, {renderer: 'svg'})
      .then(() => {
        const svg = el.querySelector('svg')
        if (!svg) return
        svg.innerHTML += `<defs>${pattern}</defs>`
      })
  }
  return <div ref={set_el}/>
}

function embed(spec: VegaEmbed.VisualizationSpec): React.ReactNode {
  return <Embed spec={spec}/>
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


// horizontal barchart
export function barchart(data: any[], opts?: Partial<Options>): React.ReactNode {
  const options = {...default_options, ...opts}
  const {row, height, x, y} = orient(options)
  return embed({
    $schema: "https://vega.github.io/schema/vega-lite/v4.json",
    data: {values: data},
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
      [height]: {step: 12},
      encoding: {
        [x]: {
          aggregate: "sum", field: "expression", type: "quantitative",
          axis: {title: "expression", grid: false}
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
              scale: {scheme: "tableau20"},
              legend: options.legend ? undefined : null,
            }
          },
        },
        {
          mark: "bar",
          encoding: {
            fill: {
              field: "location", type: "nominal",
              scale: {range: ["#fff0", "url(#stripe)"]},
              legend: options.legend ? undefined : null,
            }
          },
        }
      ],
    },
    config: {
      view: {stroke: "transparent"},
      axis: {domainWidth: 1},
      facet: {spacing: 5},
    }
  })
}

export function forest(data: any[], opts?: Partial<Options>): React.ReactNode {
  const options = {...default_options, ...opts}
  const {row, height, x, x2, y} = orient(options)
  return embed({
    $schema: "https://vega.github.io/schema/vega-lite/v4.json",
    data: {values: data},
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
      [height]: {step: 12},
      encoding: {
        [y]: {
          field: "location", type: "nominal",
          axis: null,
        },
        [x]: {
          field: "lower", type: "quantitative",
          axis: {title: "HR", grid: false}
        },
        [x2]: {
          aggregate: "sum", field: "upper",
        },
        color: {
          field: "cell", type: "nominal",
          scale: {scheme: "tableau20"},
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
              scale: {range: ["#fff0", "url(#stripe)"]},
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
      view: {stroke: "transparent"},
      axis: {domainWidth: 1},
      facet: {spacing: 5},
    }
  })
}

