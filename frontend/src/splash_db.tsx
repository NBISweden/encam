/**

  This file types the data the shown in the splash screen.

*/
import * as utils from './utils'

export interface SplashRow {
  tumor: string
  cell: string
  location: string
  expression: number
  coef: number
  lower: number
  upper: number
  p: number
}

export type SplashDB = SplashRow[]

export type SplashDBRange = utils.RowRange<SplashRow>

/** Artur's preferred cell order */
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
  'Myeloid_cell',
  'iDC',
  'mDC',
  'pDC',
  'Granulocyte',
]

/** Cells with underscores in names */
export const cells = cellOrder.filter(cell => !cell.match(/ /))
