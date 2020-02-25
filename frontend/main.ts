declare const require: Function

interface Innermost {
  expression: number
  coef: number
  lower: number
  upper: number
  p: number
}

type Loc = 'STROMA' | 'TUMOR'

type DB = Record<string, Record<string, Record<Loc, Innermost>>>

interface DBs {
  by_tumor: DB,
  by_cell: DB
}

const db: DBs = require('./db.json')

console && console.log(db)

document.body.innerHTML = `<pre>${JSON.stringify(db, undefined, 2)}</pre>`

declare const module: {hot?: {accept: Function}}
module.hot && module.hot.accept()

