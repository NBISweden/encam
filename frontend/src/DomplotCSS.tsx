import * as React from 'react'
import * as stripes from './stripes'

import {Global, css} from '@emotion/core'

export const DomplotCSS = () => (
  <Global
    styles={css`
  .striped {
    background-image: url('data:image/svg+xml;base64,${btoa(stripes.patternSVG)}')
  }
`}
  />
)
