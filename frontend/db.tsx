import * as random_js from 'random-js'

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

export const make_gen = () => random_js.MersenneTwister19937.seed(84000)

export function expand(rows: DB) {
  const gen = make_gen()
  const range = utils.row_range(rows)
  const out = rows.slice()
  for (let i = 0; i < 8; ++i) {
    range.cell.forEach(cell => {
      range.location.forEach(location => {
        const proto = {...random_js.pick(gen, rows)}
        while (proto.upper > 2 && gen.next() % 10 != 0) {
          proto.coef *= 0.2
          proto.lower *= 0.2
          proto.upper *= 0.2
        }
        out.push({
          ...proto,
          tumor: 'type' + '₁₂₃₄₅₆₇₈₉'[i],
          cell,
          location,
        })
      })
    })
  }
  return out
}

declare const require: Function
export const db: DB = require('./db.json')

declare global {
  interface Window {
    db: DB
  }
}

window.db = db

export const range = utils.row_range(db)

export const filter = (by: 'cell' | 'tumor', value: string) => db.filter(row => row[by] == value)

export const pick_cells = (s: string) => db.filter(row => s.split(' ').some(name => name == row.cell))

