import * as ui from '../ui_utils'
import * as utils from '../utils'
import type * as VL from 'vega-lite'

import * as React from 'react'

import {Embed} from './Embed'

import {cell_color, color_scheme} from '../cell_colors'

export interface Options<K extends string> {
  inner: K | K[]
  facet: K | K[]
  split: K | K[]
  color: K | K[]
  stripes: K
  landscape: boolean
  legend: boolean
  inner_axis: boolean
  scale: {type: 'linear' | 'semilog'} | {type: 'pow'; exponent: number}
  mode: 'default' | 'min-max' | 'outliers'
  show_mean: boolean
  trimmable: Record<K, boolean>
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
  trimmable: {},
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

export const Boxplot = React.memo(function Boxplot<
  K extends string,
  Row extends Record<K, any> & Precalc
>({data, options}: {data: Row[]; options?: Partial<Options<K>>}) {
  ui.useWhyChanged(Boxplot, {data, options})
  return precalc_boxplot(data, options)
})

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

import {cellOrder} from './../db'

function precalc_boxplot<K extends string, Row extends Record<K, any> & Precalc>(
  data0: Row[],
  opts?: Partial<Options<K>>
): React.ReactElement {
  let data = data0.map(x => ({...x} as Record<string, any>))

  const options = {...(default_options as Options<K>), ...opts}

  const {column, row, height, width, x, y, y2} = orient(options)

  let scale
  if (options.scale) {
    if (options.scale.type == 'pow') {
      scale = {type: 'pow', exponent: options.scale.exponent}
    } else if (options.scale.type == 'semilog') {
      scale = {type: 'semilog'}
    }
  }

  data.map(datum => {
    datum.cell_color = cell_color(datum.cell)
    datum.location = datum.location.toLowerCase()
    datum.loc_order = datum.location == 'stroma' ? 1 : 0
    datum.cell_order = cellOrder.indexOf(datum.cell)
  })

  const prepare_option = (keys: K | K[], sep = ',') => {
    const array = ensure_array(keys).filter(k => {
      if (!(options.trimmable || ({} as Record<K, boolean>))[k]) {
        return true
      }
      const range = utils.uniq(data.map(datum => datum[k]))
      const nontrivial = range.length > 1
      // console.log(k, 'is', nontrivial ? 'nontrivial' : 'trivial', range)
      return nontrivial
    })
    const key = array.join(', ')
    if (array.length) {
      data.forEach(datum => {
        datum[key] = array.map(field => datum[field]).join(sep)
      })
    }
    return key
  }

  const inner = prepare_option(options.inner)
  const facet = prepare_option(options.facet)
  const split = prepare_option(options.split)
  const color = prepare_option(options.color, ' ')

  data.forEach(datum => {
    datum.order_tuple = [...ensure_array(options.facet), ...ensure_array(options.inner)].map(
      k => datum[k == 'location' ? 'loc_order' : k == 'cell' ? 'cell_order' : k]
    )
  })

  data.sort(utils.by_tuple(datum => datum.order_tuple))

  data.forEach((datum, i) => {
    datum.order = i
  })

  data.forEach(datum => {
    datum.cell = utils.pretty(datum.cell)
  })

  const size = 9

  const tooltip = [
    {field: 'cell', type: 'nominative', title: 'Cell type'},
    {field: 'group', type: 'nominative', title: 'Group'},
    {field: 'tumor', type: 'nominative', title: 'Tumor type'},
    {field: 'location', type: 'nominative', title: 'Location'},
    {field: 'max', type: 'quantitative', format: '.1f', title: 'Max'},
    {field: 'upper_outliers', type: 'quantitative', format: '.1f', title: 'Upper outlier count'},
    {field: 'q3', type: 'quantitative', format: '.1f', title: 'Q3'},
    {field: 'mean', type: 'quantitative', format: '.1f', title: 'Mean'},
    {field: 'median', type: 'quantitative', format: '.1f', title: 'Median'},
    {field: 'q1', type: 'quantitative', format: '.1f', title: 'Q1'},
    {field: 'lower_outliers', type: 'quantitative', format: '.1f', title: 'Lower outlier count'},
    {field: 'min', type: 'quantitative', format: '.1f', title: 'Min'},
  ]

  const spec: VL.TopLevelSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
    data: {name: 'data'},
    facet: {
      [column]: {
        field: facet,
        type: 'ordinal',
        sort: {field: 'order'},
        header: {
          labelAngle: options.landscape ? -90 : 0,
          labelAlign: options.landscape ? 'right' : 'left',
          labelOrient: options.landscape ? 'bottom' : undefined,
          title: null,
          // labelExpr: `[
          //   truncate(split(datum.value, ",")[1] || '', 6),
          //   truncate(split(datum.value, ",")[0], 6),
          // ]`,
        },
      },
      ...(split
        ? {
            [row]: {
              field: split,
              type: 'ordinal',
              sort:
                split == 'location'
                  ? {
                      field: 'loc_order',
                    }
                  : {},
              header: {
                // labelAngle:  options.landscape ? 0 : -45,
                // labelAlign:  options.landscape ? "left" : "right",
                // labelOrient: options.landscape ? undefined : "bottom",
                title: null,
                // labelAnchor: null,
                labelExpr: '""',
              },
            },
          }
        : {}),
    },
    spec: {
      [height]: 300,
      [width]: {step: 13},
      encoding: {
        [x]: {
          field: inner,
          type: 'nominal',
          sort: {
            field: 'order',
          },
          axis: {
            title: null,
            labelExpr: '',
            tickSize: 0,
          },
        },
        tooltip: tooltip as any,
      },
      layer: [
        {
          mark: {type: 'rule'},
          encoding: {
            [y]: {
              axis: {title: 'cell density (1/mm²)'},
              field: options.mode == 'min-max' ? 'min' : 'lower',
              type: 'quantitative',
              scale: scale,
            },
            color: {
              value: 'black',
            },
            [y2]: {field: 'q1'},
          },
        },
        {
          mark: {type: 'rule'},
          encoding: {
            [y]: {field: 'q3', type: 'quantitative'},
            [y2]: {field: options.mode == 'min-max' ? 'max' : 'upper'},
            color: {value: 'black'},
          },
        },
        {
          mark: {type: 'bar', size},
          encoding: {
            [y]: {field: 'q1', type: 'quantitative'},
            [y2]: {field: 'q3'},
            stroke: {value: '#000', legend: null},
            strokeWidth: {value: 1.5, legend: null},
          },
        },
        {
          mark: {type: 'bar', size},
          encoding: {
            [y]: {field: 'q1', type: 'quantitative'},
            [y2]: {field: 'q3'},
            color: {
              field: color,
              type: 'nominal',
              legend: options.legend ? {} : null,
            },
          },
        },
        {
          mark: {type: 'bar', size},
          encoding: {
            [y]: {field: 'q1', type: 'quantitative'},
            [y2]: {field: 'q3'},
            fill: {
              field: 'location',
              scale: {
                domain: ['tumor', 'stroma'],
                range: ['#fff0', 'url(#stripe)'],
              },
              type: 'nominal',
              legend: options.legend ? {} : null,
            },
          },
        },
        {
          mark: {type: 'tick', size},
          encoding: {
            [y]: {field: 'median', type: 'quantitative'},
            stroke: {value: 'black'},
            strokeWidth: {value: 1},
            opacity: {value: 1},
          },
        },
        ...(options.show_mean
          ? [
              {
                mark: {
                  type: 'point' as 'point',
                  shape: 'circle',
                  // shape: 'M-1 -1 L1 1 M1 -1 L-1 1'
                },
                encoding: {
                  [y]: {field: 'mean'},
                  stroke: {value: 'black'},
                  fill: {value: 'black'},
                  size: {value: 10},
                  strokeWidth: {value: 1},
                  opacity: {value: 1},
                },
              },
            ]
          : []),
      ],
    },
    config: {
      view: {stroke: 'transparent'},
      // axis: { grid: true },
      // axis: { domainWidth: 1 },
      facet: {spacing: 6},
      range: {
        category: color_scheme,
      },
    },
  }
  return <Embed {...{spec, data}} />
}

import stories from '@app/ui_utils/stories'
import * as boxplot_data from '../data/boxplot'

stories(add => {
  add(
    <Boxplot
      data={boxplot_data.rows}
      options={{
        facet: 'cell',
        inner: ['tumor', 'group', 'location'],
        color: ['tumor', 'group'],
      }}
    />
  ).snap()
})
