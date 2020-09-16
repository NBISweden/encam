import {css, Global} from '@emotion/core'

import * as React from 'react'

const styles = css`
  * {
    user-select: inherit;
  }
  html {
    width: fit-content;
    user-select: none;
  }
`

export const GlobalStyle = () => <Global {...{styles}} />

const main = css`
  * {
    user-select: inherit;
  }
  html,
  body,
  #root {
    width: 100%;
    display: flex;
    user-select: none;
  }
  html > body {
    background: #eee;
    background: linear-gradient(0deg, #ddd 0%, #fafafa 100%);
    background-repeat: no-repeat;
  }
`

export const MainGlobalStyle = () => <Global styles={main} />
