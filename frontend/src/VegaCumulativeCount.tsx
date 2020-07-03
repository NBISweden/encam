import * as ui from './ui_utils'
import * as VL from 'vega-lite'

import * as React from 'react'
import * as utils from './utils'

import {Embed} from './vega_utils'

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

interface Row {
  value: number
  count: number
  cucount: number
  bin: number
}

export function cucount(values: number[], cutoffs: number[]): Row[] {
  const bin = (x: number) => cutoffs.filter(y => x > y).length
  const points = {} as Record<number, number>
  for (let value of values.sort(utils.by(x => x))) {
    points[value] = (points[value] ?? 0) + 1
  }
  let counts = 0
  const data = Object.entries(points).map(([value, count]) => {
    counts += count
    return {
      value: Number(value),
      count: count,
      cucount: counts,
      bin: bin(counts),
    }
  })
  return data
}

export const VegaCumulativeCount = React.memo(function VegaKMPlot({
  data,
  options,
}: {
  data: Row[]
  options?: Partial<Options>
}) {
  ui.useWhyChanged(VegaKMPlot, {data, options})
  return vega_cumulative_count(data, options)
})

function vega_cumulative_count(data: Row[], opts?: Partial<Options>): React.ReactElement {
  const options = {...default_options, ...opts}

  const {column, row, height, width, x, y, y2} = orient(options)

  // const defaultCutoffs = [260, 300, 320]
  const spec: VL.TopLevelSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
    data: {name: 'data'},
    [height]: 350,
    [width]: 500,
    layer: [
      {
        mark: {
          type: 'area',
          interpolate: 'step-after',
        },
        encoding: {
          [x]: {
            field: 'value',
            axis: {title: 'cell density (1/mm²)'},
            type: 'quantitative',
            scale: {type: 'pow', exponent: 0.25},
          },
          [y]: {
            field: 'cucount',
            axis: {title: 'cumulative record count'},
            type: 'quantitative',
            // scale: {type: 'pow', exponent: 2}
          },
          color: {
            field: 'bin',
            legend: null,
            type: 'nominal',
          },
        },
      },
    ],
  }

  return <Embed {...{spec, data}} />
}
