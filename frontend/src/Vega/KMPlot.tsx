/** KMPlot = Kaplan-Meier plot, a type of survival plot */
import * as ui from '../ui_utils'
import * as utils from '../utils'
import * as VL from 'vega-lite'

import * as React from 'react'

import {Embed} from './Embed'

import {cell_color} from '../cell_colors'

export interface Options {
  landscape: boolean
  ci: boolean
}

const default_options: Options = {
  landscape: true,
  ci: true,
}

function orient(options: Options) {
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

export interface KMRow {
  time: number
  group: number
  fit: number
  lower: number
  upper: number
}

export const KMPlot = React.memo(function KMPlot({
  data,
  options,
}: {
  data: KMRow[]
  options?: Partial<Options>
}) {
  // ui.useWhyChanged(KMPlot, {rows, options})
  return kmplot(data, options)
})

function kmplot(rows: KMRow[], opts?: Partial<Options>): React.ReactElement {
  const options = {...default_options, ...opts}

  const {column, row, height, width, x, y, y2} = orient(options)

  // const groups = utils.row_range(rows).group
  // const group_names = {
  //   [Math.max(...groups)]: 'low',
  //   [Math.min(...groups)]: 'high',
  // }

  // function group_name(g: number) {
  //   const name = group_names[g]
  //   return g = (name ? ' ' + name : '')
  // }

  function group_name(g: number) {
    return g + ''
  }

  const data = rows.map(row => ({...row, group_name: group_name(row.group)}))

  const spec: VL.TopLevelSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
    data: {name: 'data'},
    [height]: 350,
    [width]: 500,
    layer: [
      {
        mark: {
          type: 'line',
          interpolate: 'step-after',
        },
        encoding: {
          [x]: {
            axis: {title: 'time (weeks)'},
            field: 'time',
            type: 'quantitative',
          },
          [y]: {
            axis: {title: 'probability'},
            field: 'fit',
            type: 'quantitative',
          },
          color: {
            title: 'group',
            field: 'group_name',
            type: 'ordinal',
            scale: {scheme: 'viridis'},
          },
        },
      },
      {
        mark: {
          type: 'area',
          interpolate: 'step-after',
        },
        encoding: {
          [x]: {
            field: 'time',
            type: 'quantitative',
          },
          [y]: {
            field: 'upper',
            type: 'quantitative',
          },
          [y2]: {
            field: 'lower',
            type: 'quantitative',
          },
          fill: {
            title: 'group',
            field: 'group_name',
            type: 'ordinal',
            scale: {scheme: 'viridis'},
          },
          fillOpacity: {
            value: options.ci ? 0.3 : 0.0,
          },
        },
      },
    ],
  }
  return Embed({spec, data})
}
