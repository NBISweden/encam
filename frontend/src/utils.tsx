/**

  Utilities to make up for the shortcomings in the JS stdlib.

  One could use lodash or ramda but it's usually quicker to just
  write the function yourself rather than wading through their
  documentation. :face_with_rolling_eyes: :shrugs:

*/

/** Adds a plural 's' if needed.

  pluralise(true, 'word') // => 'words'
  pluralise(false, 'word') // => 'word'

  Note: Not very ambitious!

  pluralise(true, 'foot') // => 'foots'
  pluralise(true, 'bus') // => 'buss'

*/
export function pluralise(is_plural: boolean, word: string) {
  return word + (is_plural ? 's' : '')
}

/**

  const xs = [10,1,3]
  xs.sort() // => [1,10,3]
  xs.sort(by(x => x)) // => [1,3,10]

*/
export function by<A, B>(f: (a: A) => B) {
  return (x: A, y: A) => {
    const fx = f(x)
    const fy = f(y)
    return fx > fy ? 1 : fx == fy ? 0 : -1
  }
}

/**

  const xs = [[0,1],[1,0],[0,0],[1,1]]
  xs.sort(by_tuple(x => x)) // => [[0,0],[0,1],[1,0],[1,1]]

  const xs = [[], [0], [0,0], [0,0,0], [0,1,0]].reverse()
  xs.sort(by_tuple(x => x)) // => [[], [0], [0,0], [0,0,0], [0,1,0]]

*/
export function by_tuple<A, B>(f: (a: A) => B[]) {
  return (x: A, y: A) => {
    const xs = f(x)
    const ys = f(y)
    let i = 0
    while (xs[i] === ys[i] && i < xs.length && i < ys.length) {
      i++
    }
    return xs[i] > ys[i] ? 1 : xs[i] === ys[i] ? 0 : -1
  }
}

/** Rounds down to N digits of precision (default N=1)

   roundDown(999)      // => 900
   roundDown(999, 2)   // => 990
   roundDown(999, 3)   // => 999

   roundDown(0.123)    // => 0.1
   roundDown(0.123, 2) // => 0.12
   roundDown(0.123, 3) // => 0.123

*/
export function roundDown(x: number, p = 1): number {
  if (x === 0) {
    return 0
  }
  const d = Math.pow(10, Math.floor(Math.log10(x)) - p + 1)
  return Math.floor(x / d) * d
}

/** Traverses a structure of pojos, arrays and primitives and applies to
    function bottom-up to every substructure

    traverse({x:[1,2,{y:3}]}, x => typeof x === 'number' ? (x + 1) : x)
      // => {x:[2,3,{y:4}]}

    traverse({x:[1,2,{y:[3,4]}]}, x => Array.isArray(x) ? x.slice().reverse() : x)
      // => {x:[{y:[4,3]},2,1]}

*/
export function traverse(
  d: any,
  f: (x: any, k?: number | string) => any,
  k?: number | string
): any {
  if (Array.isArray(d)) {
    return f(
      d.map((x, i) => traverse(x, f, i)),
      k
    )
  } else if (d && typeof d === 'object') {
    return f(
      mapObject(d, (x, k) => traverse(x, f, (k as any) as string)),
      k
    )
  } else {
    return f(d, k)
  }
}

/**

  sum([])     // => 0
  sum([8,-1]) // => 7

*/
export function sum(values: number[]): number {
  let res = 0
  for (let i = 0; i < values.length; ++i) {
    res += values[i]
  }
  return res
}

/** Enumerates [0,1, .., N-1]

  enumTo(5) // => [0,1,2,3,4]

  enumTo(0) // => []

  enumTo(-1) // => []

*/
export function enumTo(elements: number): number[] {
  const out: number[] = []
  for (let i = 0; i < elements; ++i) {
    out.push(i)
  }
  return out
}

/**

  const a1 = {x: 'a', y: 2}
  const a2 = {x: 'a', z: 3}
  const b1 = {x: 'b', w: 4}
  groupBy('x', [a1, b1, a2]) // => {a: [a1, a2], b: [b1]}

*/
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

/** Returns a copy of the array with duplicates removed, via reference equality

  uniq([8,3,8,1]) // => [8,3,1]

  const x = {}
  const y = {}
  uniq([x,x,y,x,y]) // => [x,y]

*/
export function uniq<A>(xs: A[]): A[] {
  const seen = new Set()
  return xs.filter(x => {
    const duplicate = seen.has(x)
    seen.add(x)
    return !duplicate
  })
}

export type RowRange<A extends Record<string, any>> = {[K in keyof A]: A[K][]}

/**

  unzip([{a: 1, b: 2}, {a: 3, b: 2}])
    // => {a: [1, 3], b: [2, 2]}

*/
export function unzip<A extends Record<string, any>>(xs: A[]): RowRange<A> {
  const out = {} as any
  for (const k of Object.keys(xs[0])) {
    out[k] = xs.map(x => x[k])
  }
  return out
}

/**

  row_range([{a: 1, b: 2}, {a: 3, b: 2}])
    // => {a: [1, 3], b: [2]}

*/
export function row_range<A extends Record<string, any>>(xs: A[]): RowRange<A> {
  return mapObject(unzip(xs), uniq)
}

/** Splits up keys on commas to nested dictionaries

  expand({'a,b': 1}) // => {a: {b: 1}}

  expand({'a,b': 1, 'a,c': 2}) // => {a: {b: 1, c: 2}}

  expand({'a,b': 1, c: 2}) // => {a: {b: 1}, c: 2}

*/
export function expand<A>(d: Record<string, A>): Record<string, A | Record<string, A>> {
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

/** The true values

  selected({}) // => []

  selected({x: true, y: false, z: true}) // => ['x', 'z']

*/
export function selected(d: Record<string, boolean>): string[] {
  return Object.entries(d)
    .filter(([_, v]) => v)
    .map(([k, _]) => k)
}

/** The last N values

  last(3, [1,2,3,4,5,6,7]) // => [5,6,7]
  last(3, [6,7]) // => [6,7]

*/
export function last<A>(N: number, xs: A[]): A[] {
  return xs.reverse().slice(0, N).reverse()
}

/** Allow at most N true, biased towards the end

  cap(2, {x: true, y: true, w: false, z: true}) // => {y: true, z: true}

*/
export function cap(N: number, d: Record<string, boolean>) {
  return Object.fromEntries(last(N, selected(d)).map(k => [k, true]))
}

/**

  const M = Memoizer()
  let i = 0;
  [M(1, () => { i++; return 'one' }), i]; // => ['one', 1]
  [M(1, () => { i++; return 'one' }), i]; // => ['one', 1]
  [M(1, () => { i++; return 'one' }), i]; // => ['one', 1]
  [M(2, () => 'boop'), i]; // => ['boop', 1]

*/
export function Memoizer<K, V>() {
  const mems = {} as Record<string, V>
  return function memo(k: K, calc: () => V): V {
    const ks = str(k)
    if (!(ks in mems)) {
      mems[ks] = calc()
    } else {
    }
    return mems[ks]
  }
}

/**

  mapObject({x: 42, y: 43}, (v, k, i) => [v, k, i])
    // => {x: [42, 'x', 0], y: [43, 'y', 1]}

*/
export function mapObject<A extends Record<string, any>, B extends Record<keyof A, any>>(
  m: A,
  f: <K extends keyof A>(a: A[K], k: K, i: number) => B[K]
): B
export function mapObject<K extends string, A, B>(
  m: Record<K, A>,
  f: (a: A, k: K, i: number) => B
): Record<K, B> {
  return Object.fromEntries(Object.entries(m).map(([k, a], i) => [k, f(a as A, k as K, i)])) as any
}

export function createObject<A, B>(
  xs: A[],
  k: (a: A) => string,
  v: (a: A, k: string) => B
): Record<string, B> {
  const out = {} as any
  for (const x of xs) {
    const key = k(x)
    out[key] = v(x, key)
  }
  return out
}

/**

  simple_object_diff({x: 1, y: 2, z: 3}, {y: 2, z: 4, w: 5})
    // => {z: 4, w: 5}

*/
export function simple_object_diff<A extends Record<string, any>, B extends Record<string, any>>(
  prev: A,
  now: B
): Partial<B> {
  const diff = {} as any
  const keys = [...Object.keys(prev), ...Object.keys(now)]
  uniq(keys).map(k => {
    if (str(prev[k]) != str(now[k])) {
      diff[k] = now[k]
    }
  })
  return diff
}

/** JSON string representation of a value */
export const str = (a: any) => JSON.stringify(a)

/** Pretty-printed JSON string representation of a value */
export const pp = (a: any) => JSON.stringify(a, undefined, 2)

/** Equality by comparing JSON string representation

  equal([], []) // => true

  equal({x: 1}, {x: 1}) // => true

  equal({x: 1}, {x: 2}) // => false

  Note: keys are not sorted

  equal({x: 1, y: 2}, {y: 2, x: 1}) // => false


*/
export function equal(x: any, y: any): boolean {
  return str(x) === str(y)
}

/** Are these arrays equal, considering them to be multisets?

  multiset_equal([1,8], [8,1])   // => true
  multiset_equal([1,8], [8,1,1]) // => false
  multiset_equal([1,8], [8])     // => false

*/
export function multiset_equal(xs: any[], ys: any[]): boolean {
  return equal(xs.slice().sort(), ys.slice().sort())
}

/** Splice, but on a

  const xs = [1,2,3,4,5]
  splice(xs, 1, 3, 8, 9) // => [1,8,9,5]
  xs // => [1,2,3,4,5]

*/
export function splice<A>(xs: A[], start: number, delete_count: number, ...items: A[]): A[] {
  const ys = xs.slice()
  ys.splice(start, delete_count, ...items)
  return ys
}

/** Snap to closest points.

  Note: very inefficiently implemented, O(|xs|^2|dests|)

  snap([1], [0, 10]) // => [0]
  snap([5], [0, 10]) // => [0]
  snap([6], [0, 10]) // => [10]
  snap([9], [0, 10]) // => [10]

  snap([10, 11],     [0, 10, 20, 30]) // => [10, 20]
  snap([10, 11, 12], [0, 10, 20, 30]) // => [10, 0, 20]

  snap([1,2,3,4,5], [1,2,3,4,5]) // => [1,2,3,4,5]
  snap([1,2,3,4,5], [5,4,3,2,1]) // => [1,2,3,4,5]
  snap([5,4,3,2,1], [1,2,3,4,5]) // => [5,4,3,2,1]
  snap([5,4,3,2,1], [5,4,3,2,1]) // => [5,4,3,2,1]

  snap([1, 2], []) // => [1, 2]

  snap([1, 2], [0]) // => [0, 2]

*/
export function snap(xs: number[], dests: number[]) {
  let shortest = Infinity
  let ret = () => xs
  xs.forEach((x, i) =>
    dests.forEach((dest, j) => {
      const dist = Math.abs(x - dest)
      if (dist < shortest) {
        shortest = dist
        ret = () => {
          const xs_2 = splice(xs, i, 1)
          const dests_2 = splice(dests, j, 1)
          const res = snap(xs_2, dests_2)
          return splice(res, i, 0, dest)
        }
      }
    })
  )
  return ret()
}

/** Deep copy via JSON.stringify.

  const a = {x: 1}
  copy(a) // => a
  copy(a) === a // => false

*/
export function copy<A>(x: A): A {
  return JSON.parse(str(x))
}
