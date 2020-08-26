import * as sc from 'styled-components'

export const GlobalStyle = sc.createGlobalStyle`
  * {
    user-select: inherit;
  }
  html {
    width: fit-content;
    user-select: none;
  }
`

export const MainGlobalStyle = sc.createGlobalStyle`
  * {
    user-select: inherit;
  }
  html, body, #root {
    width: 100%;
    display: flex;
    user-select: none;
  }
  html>body {
    background: #eee;
    background: linear-gradient(0deg, #ddd 0%, #fafafa 100%);
    background-repeat: no-repeat;
  }
`
