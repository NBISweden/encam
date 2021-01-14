import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {App} from './App'
import {BrowserRouter} from 'react-router-dom'

if (typeof process === 'undefined') {
  // https://github.com/rexxars/react-markdown/issues/339
  window.process = {
    cwd: () => '',
  } as any
}

const root = (
  <BrowserRouter>
    <App />
  </BrowserRouter>
)

ReactDOM.render(root, document.getElementById('root'))

if (import.meta.hot) {
  // Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
  // Learn more: https://www.snowpack.dev/#hot-module-replacement
  import.meta.hot.accept()
}
