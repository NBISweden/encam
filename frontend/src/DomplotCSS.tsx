import * as sc from 'styled-components'
import * as stripes from './stripes'

export const DomplotCSS = sc.createGlobalStyle`
  .striped {
    background-image: url('data:image/svg+xml;base64,${btoa(stripes.patternSVG)}')
  }
`
