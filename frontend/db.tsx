import * as random_js from 'random-js'

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

/** Returns a copy of the array with duplicates removed, via reference equality */
export function uniq<A>(xs: A[]): A[] {
  const seen = new Set()
  return xs.filter(x => {
    const duplicate = seen.has(x)
    seen.add(x)
    return !duplicate
  })
}

export function row_range<A extends Record<string, any>>(d: A[]): {[K in keyof A]: A[K][]} {
  const out = {} as any
  for (const k of Object.keys(d[0])) {
    out[k] = uniq(d.map(x => x[k]))
  }
  return out
}

export const make_gen = () => random_js.MersenneTwister19937.seed(84000)

export function expand(rows: DB) {
  const gen = make_gen()
  const range = row_range(rows)
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
export const db: DB = expand(require('./db.json'))

declare global {
  interface Window {
    db: DB
  }
}

window.db = db

export const range = row_range(db)

export function pretty(s: string | number) {
  if (typeof s === 'number') {
    return s
  }
  const s2 = s.replace('_', ' ')
  if (s2.toLowerCase() == s2) {
    return s2[0].toUpperCase() + s2.slice(1)
  } else {
    return s2
  }
}

export const filter = (by: 'cell' | 'tumor', value: string) => db.filter(row => row[by] == value)

export const pick_cells = (s: string) => db.filter(row => s.split(' ').some(name => name == row.cell))

