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
  table {
    color: unset;
  }
  .MuiTab-root {
    text-transform: unset;
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
`

export const MainGlobalStyle = () => <Global styles={main} />

export const ScrollBodyGlobalStyle = () => (
  <Global
    styles={css`
      body {
        overflow-y: scroll;
      }
    `}
  />
)
