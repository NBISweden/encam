import * as React from 'react'

export function useAssertConstant(...initials: any[]) {
  if (process.env.NODE_ENV === 'development') {
    for (const initial of initials) {
      const {current} = React.useRef(initial)
      if (current !== initial) {
        throw new Error(`Assertion failed, value not constant: ${initial} !== ${current}`)
      }
    }
  }
}
