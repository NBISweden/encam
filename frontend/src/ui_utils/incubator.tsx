
import * as React from 'react'
import * as utils from '../utils'

export type Element = React.ReactElement

// could make a portal to just get the element out of the way, will allow for one twiggler (per id)

export function twiggler<A>(make: (add: <B>(thing: [B, Element]) => B) => A): [A, Element] {

  const es: Element[] = []

  const a = make(([b, e]) => {
    es.push(e)
    return b
  })

  return [
    a,
    <div style={{position: 'fixed', left: 0, bottom: 0}}>
      {es}
    </div>
  ]

}

export function twig<R extends Record<string, any>>(fields: {[K in keyof R]: [R[K], Element]}): [R, Element] {
  return twiggler(add => utils.mapObject(fields, add) as any)
}

export type Add = <B>(thing: [B, Element]) => B

