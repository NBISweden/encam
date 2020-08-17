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

/**
  since we round upwards we need to skip one
  since we don't want to select the last one we need to skip another one

  slider_max(cucount([100,200,300,400,500], [1])) // => 3
  slider_max(cucount([100,200,200,300,    400,    500    ], [1])) // => 4
  slider_max(cucount([100,200,    300,300,400,    500    ], [1])) // => 4
  slider_max(cucount([100,200,    300,    400,400,500    ], [1])) // => 3
  slider_max(cucount([100,200,    300,    400,    500,500], [1])) // => 3
*/
export function slider_max(rows: Row[]): number {
  const rrows = rows.slice().reverse()
  if (rrows.length < 2) {
    return 0
  } else {
    return rrows[2].cucount
  }
}

/*

  bin_sizes(cucount([10,10,11,11], [0])) // => [0, 4]
  bin_sizes(cucount([10,10,11,11], [1])) // => [2, 2]
  bin_sizes(cucount([10,10,11,11], [2])) // => [2, 2]
  bin_sizes(cucount([10,10,11,11], [3])) // => [4, 0]
  bin_sizes(cucount([10,10,11,11], [4])) // => [4, 0]

  bin_sizes(cucount([4,5,6,7,8], [1,2,3,4])) // => [1,1,1,1,1]

*/
export function bin_sizes(rows: Row[]): number[] {
  const N = Math.max(0, ...rows.map(row => row.bin))
  return utils
    .enumTo(1 + N)
    .map(bin => utils.sum(rows.map(row => (row.bin == bin ? row.count : 0))))
}

export const VegaCumulativeCount = React.memo(function VegaCumulativeCount({
  data,
  options,
}: {
  data: Row[]
  options?: Partial<Options>
}) {
  // ui.useWhyChanged(VegaCumulativeCount, {data, options})
  return vega_cumulative_count(data, options)
})

function vega_cumulative_count(data0: Row[], opts?: Partial<Options>): React.ReactElement {
  const sizes = bin_sizes(data0)
  const acc_sizes = sizes.map((s, i) => s + utils.sum(sizes.filter((_, j) => j < i)))
  const data = data0.flatMap(obj => {
    const cucount = obj.cucount - (obj.bin == 0 ? 0 : acc_sizes[obj.bin - 1])
    const new_obj = {...obj, cucount}
    const below = acc_sizes.flatMap((size, bin) => size < obj.cucount ? [{...obj, bin, cucount: sizes[bin]}] : [])
    return [new_obj, ...below]
  })

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
            stack: true,
            axis: {title: 'cumulative record count'},
            type: 'quantitative',
            // scale: {type: 'pow', exponent: 2}
          },
          order: {
            field: 'bin',
            type: 'quantitative',
          },
          color: {
            field: 'bin',
            legend: null,
            type: 'ordinal',
            scale: {
              scheme: 'viridis'
            }
          },
        },
      },
    ],
  }

  return <Embed {...{spec, data}} />
}
