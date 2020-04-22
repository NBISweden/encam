import * as utils from './utils'

export type CT = 'cell' | 'tumor'

export interface Row {
  tumor: string
  cell: string
  location: string
  expression: number
  coef: number
  lower: number
  upper: number
  p: number
}

export type DB = Row[]

export type DBRange = utils.RowRange<Row>

