import * as VL from 'vega-lite'

import * as React from 'react'
import * as utils from './utils'
import {unzip} from './utils'

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

export interface Row {
  value: number
  count: number
  cucount: number
  bin: number
}

/**

  const rows = cucount([5,6,7,8], [2])
  unzip(rows).value   // => [5,6,7,8]
  unzip(rows).bin     // => [0,0,1,1]
  unzip(rows).cucount // => [1,2,3,4]

  const rows = cucount([5,6,7,7,8], [2,4])
  unzip(rows).value   // => [5,6,7,8]
  unzip(rows).bin     // => [0,0,1,2]
  unzip(rows).cucount // => [1,2,4,5]

  const rows = cucount([5,6,7,7,7,8], [2,3])
  rows   // => cucount([5,6,7,7,7,8], [2,4])
  rows   // => cucount([5,6,7,7,7,8], [2,5])

  unzip(cucount([10,10,11,11], [0])).bin // => [1,1]
  unzip(cucount([10,10,11,11], [1])).bin // => [0,1]
  unzip(cucount([10,10,11,11], [2])).bin // => [0,1]
  unzip(cucount([10,10,11,11], [3])).bin // => [0,0]
  unzip(cucount([10,10,11,11], [4])).bin // => [0,0]

  unzip(cucount([10,10,11,11], [0])).value // => [10,11]
  unzip(cucount([10,10,11,11], [1])).value // => [10,11]
  unzip(cucount([10,10,11,11], [2])).value // => [10,11]
  unzip(cucount([10,10,11,11], [3])).value // => [10,11]
  unzip(cucount([10,10,11,11], [4])).value // => [10,11]

  unzip(cucount([10,10,11,11], [0])).cucount // => [2,4]
  unzip(cucount([10,10,11,11], [1])).cucount // => [2,4]
  unzip(cucount([10,10,11,11], [2])).cucount // => [2,4]
  unzip(cucount([10,10,11,11], [3])).cucount // => [2,4]
  unzip(cucount([10,10,11,11], [4])).cucount // => [2,4]

  unzip(cucount([10,10,11,11], [0])).count // => [2,2]
  unzip(cucount([10,10,11,11], [1])).count // => [2,2]
  unzip(cucount([10,10,11,11], [2])).count // => [2,2]
  unzip(cucount([10,10,11,11], [3])).count // => [2,2]
  unzip(cucount([10,10,11,11], [4])).count // => [2,2]

*/
export function cucount(values: number[], cutoffs: number[]): Row[] {
  const bin = (x: number) => cutoffs.filter(y => x >= y).length
  const points = {} as Record<number, number>
  const sorted_values = values.sort(utils.by(x => x))
  for (let value of sorted_values) {
    points[value] = (points[value] ?? 0) + 1
  }
  let counts = 0
  return utils.uniq(sorted_values).map(value => {
    const count = points[value]
    const precounts = counts
    counts += count
    return {
      value: Number(value),
      cucount: counts,
      count: count,
      bin: bin(precounts),
    }
  })
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
            type: 'ordinal',
          },
        },
      },
    ],
  }

  return <Embed {...{spec, data}} />
}
