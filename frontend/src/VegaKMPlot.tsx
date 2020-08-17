/** KMPlot = Kaplan-Meier plot, a type of survival plot */
import * as ui from './ui_utils'
import * as utils from './utils'
import * as VL from 'vega-lite'

import * as React from 'react'

import {Embed} from './vega_utils'

import {cell_color} from './cell_colors'

export interface Options {
  landscape: boolean
  legend: boolean
}

const default_options: Options = {
  landscape: true,
  legend: true,
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

export type Points = [number, number][][]

export const VegaKMPlot = React.memo(function VegaKMPlot({
  points,
  options,
}: {
  points: Points
  options?: Partial<Options>
}) {
  // ui.useWhyChanged(VegaKMPlot, {points, options})
  return kmplot(points, options)
})

function kmplot(points: Points, opts?: Partial<Options>): React.ReactElement {
  const options = {...default_options, ...opts}

  const {column, row, height, width, x, y, y2} = orient(options)

  const size = 8

  const tooltip = [
    {field: 'cell', type: 'nominative', title: 'Cell type'},
    {field: 'group', type: 'nominative', title: 'Group'},
    {field: 'tumor', type: 'nominative', title: 'Tumor type'},
    {field: 'location_lowercase', type: 'nominative', title: 'Location'},
    {field: 'max', type: 'quantitative', format: '.1f', title: 'Max'},
    {field: 'upper_outliers', type: 'quantitative', format: '.1f', title: 'Upper outlier count'},
    {field: 'q3', type: 'quantitative', format: '.1f', title: 'Q3'},
    {field: 'mean', type: 'quantitative', format: '.1f', title: 'Mean'},
    {field: 'median', type: 'quantitative', format: '.1f', title: 'Median'},
    {field: 'q1', type: 'quantitative', format: '.1f', title: 'Q1'},
    {field: 'lower_outliers', type: 'quantitative', format: '.1f', title: 'Lower outlier count'},
    {field: 'min', type: 'quantitative', format: '.1f', title: 'Min'},
  ]

  const num_groups = points.length

  function group_name(x: number) {
    if (x == 0) {
      return x + ' (low)'
    } else if (x == num_groups - 1) {
      return x + ' (high)'
    } else if (x == Math.floor(num_groups / 2)) {
      return x + ' (mid)'
    } else {
      return x + ''
    }
  }

  const data = points.flatMap((group, index) =>
    group.map(([time, prob]) => ({time, prob, group: group_name(index)}))
  )

  const spec: VL.TopLevelSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
    data: {name: 'data'},
    [height]: 350,
    [width]: 500,
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
        field: 'prob',
        type: 'quantitative',
      },
      color: {
        title: 'group',
        field: 'group',
        type: 'ordinal',
      },
    },
    config: {
      view: {stroke: 'transparent'},
      // axis: { grid: true },
      // axis: { domainWidth: 1 },
      // facet: { spacing: 6 },
    },
  }
  return Embed({spec, data})
}
