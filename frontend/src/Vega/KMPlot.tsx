/** KMPlot = Kaplan-Meier plot, a type of survival plot */
import * as utils from '../utils'
import type * as VL from 'vega-lite'

import * as React from 'react'

import {Embed} from './Embed'

export interface Options {
  landscape: boolean
  ci: boolean
  color_scheme: string
  color_scheme_reverse: boolean
}

const default_options: Options = {
  landscape: true,
  ci: true,
  color_scheme: 'viridis',
  color_scheme_reverse: false,
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

export interface KMLiveRow {
  time: number
  group: number
  fit: number
}

export const KMPlot = React.memo(function KMPlot({
  data,
  live_rows,
  options,
}: {
  data: KMRow[]
  live_rows?: KMLiveRow[]
  options?: Partial<Options>
}) {
  // ui.useWhyChanged(KMPlot, {rows, options})
  return kmplot(data, live_rows, options)
})

function kmplot(
  rows: KMRow[],
  live_rows?: KMLiveRow[],
  opts?: Partial<Options>
): React.ReactElement {
  const options = {...default_options, ...opts}

  const {column, row, height, width, x, y, y2} = orient(options)

  const groups = utils.row_range(rows).group
  const group_names = {
    [Math.min(...groups)]: '(low)',
    [Math.max(...groups)]: '(high)',
  }

  function group_name(g: number) {
    const name = group_names[g]
    return g + (name ? ' ' + name : '')
  }

  // function group_name(g: number) {
  //   return g + ''
  // }

  const data = rows.map(row => ({...row, group_name: group_name(row.group)}))
  const data2 = (live_rows || []).map(row => ({...row, group_name: group_name(row.group)}))

  const spec: VL.TopLevelSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
    data: {name: 'data'},
    [height]: 350,
    [width]: 480,
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
            scale: {scheme: options.color_scheme, reverse: options.color_scheme_reverse},
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
            scale: {scheme: options.color_scheme, reverse: options.color_scheme_reverse},
          },
          fillOpacity: {
            value: options.ci ? 0.3 : 0.0,
          },
        },
      },
      {
        data: {
          name: 'data2',
        },
        mark: {
          type: 'tick',
          thickness: 0.5,
          size: 10,
        },
        encoding: {
          [x]: {
            field: 'time',
            type: 'quantitative',
          },
          [y]: {
            field: 'fit',
            type: 'quantitative',
          },
          stroke: {
            title: 'group',
            field: 'group_name',
            type: 'ordinal',
            scale: {scheme: options.color_scheme, reverse: options.color_scheme_reverse},
            legend: null,
          },
          opacity: {
            value: 1,
          },
        },
      },
    ],
  }
  return <Embed {...{spec, data, data2}} />
}

import {stories} from '../ui_utils/stories'
import * as km_data from './../data/kmplot'

stories(add => {
  add(<KMPlot data={km_data.make_points(4)} live_rows={km_data.survival.live_points} />)
})
