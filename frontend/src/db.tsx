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

// Artur's preferred cell order
export const cellOrder = [
  'CD4',
  'CD4_Treg',
  'CD8',
  'CD8_Treg',
  'B_cells',
  'NK',
  'NKT',
  'M1',
  'M2',
  'Myeloid cell',
  'iDC',
  'mDC',
  'pDC',
  'Granulocyte',
]
