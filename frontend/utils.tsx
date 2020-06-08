
export function by<A, B>(f: (a: A) => B) {
  return (x: A, y: A) => {
    const fx = f(x)
    const fy = f(y)
    return fx > fy ? 1 : fx == fy ? 0 : -1
  }
}

export function roundDown(x: number): number {
  // Rounds down to one digit precision
  // roundDown(999) => 900
  // roundDown(0.123) => 0.1
  const d = Math.pow(10, Math.floor(Math.log10(x)))
  return Math.floor(x / d) * d
}

export function enumTo(elements: number): number[] {
  const out: number[] = []
  for (let i = 0; i < elements; ++i) {
    out.push(i)
  }
  return out
}

export function groupBy<T extends Record<string, any>>(k: keyof T, rows: T[]): Record<string, T[]> {
  const res: Record<string, T[]> = {}
  rows.forEach(row => {
    const v = row[k]
    res[v] = res[v] || []
    res[v].push(row)
  })
  return res
}

export function identity<A>(a: A): A {
  return a
}

/** Returns a copy of the array with duplicates removed, via reference equality */
export function uniq<A>(xs: A[]): A[] {
  const seen = new Set()
  return xs.filter(x => {
    const duplicate = seen.has(x)
    seen.add(x)
    return !duplicate
  })
}

export type RowRange<A extends Record<string, any>> = {[K in keyof A]: A[K][]}

export function row_range<A extends Record<string, any>>(d: A[]): RowRange<A> {
  const out = {} as any
  for (const k of Object.keys(d[0])) {
    out[k] = uniq(d.map(x => x[k]))
  }
  return out
}

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

export function expand(d: Record<string, string[]>): Record<string, string[] | Record<string, string[]>> {
  const out = {} as any
  Object.entries(d).forEach(([k, v]) => {
    const m = k.match(/(.*),(.*)/)
    if (m) {
      const [_, k1, k2] = m
      if (!(k1 in out)) {
        out[k1] = {}
      }
      out[k1][k2] = v
    } else {
      out[k] = v
    }
  })
  return out
}

export function selected(d: Record<string, boolean>): string[] {
  return Object.entries(d).filter(([_, v]) => v).map(([k, _]) => k)
}

export function last<A>(N: number, xs: A[]): A[] {
  return xs.reverse().slice(0, N).reverse()
}

export function cap(N: number, d: Record<string, boolean>) {
  return Object.fromEntries(last(N, selected(d)).map(k => [k, true]))
}

export function Memoizer<K, V>() {
  const mems = {} as Record<string, V>
  return function memo(k: K, calc: () => V): V {
    const ks = JSON.stringify(k)
    if (!(ks in mems)) {
      mems[ks] = calc()
      // console.log('memo miss', k)
    } else {
      // console.log('memo hit', k)
    }
    return mems[ks]
  }
}

export function mapObject<K extends string, A, B>(m: Record<K, A>, f: (a: A, k: K, i: number) => B): Record<K, B> {
  return Object.fromEntries(Object.entries(m).map(([k, a], i) => [k, f(a as A, k as K, i)])) as any
}

export function simple_object_diff<A extends Record<string, any>, B extends Record<string, any>>(prev: A, now: B): Partial<A & B> {
  const diff = {} as any
  const keys = [...Object.keys(prev), ...Object.keys(now)]
  uniq(keys).map(k => {
    if (JSON.stringify(prev[k]) != JSON.stringify(now[k])) {
      diff[k] = now[k]
    }
  })
  return diff
}

