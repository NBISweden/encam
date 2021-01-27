/**

  Types for the data the shown in the splash screen.

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
