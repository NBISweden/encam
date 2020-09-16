import {css, Global} from '@emotion/core'

import * as React from 'react'
import * as stripes from './stripes'

const styles = css`
  .striped {
    background-image: url('data:image/svg+xml;base64,${btoa(stripes.patternSVG)}');
  }
`

export const DomplotCSS = () => <Global {...{styles}} />
