import 'core-js/features/array'
import 'core-js/features/array/flat-map'
import 'core-js/features/object'
import 'core-js/features/set'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {Views} from './Views'
import {BrowserRouter} from 'react-router-dom'

if (typeof process === 'undefined') {
  // https://github.com/rexxars/react-markdown/issues/339
  window.process = {
    cwd: () => '',
  } as any
}

const root = (
  <BrowserRouter>
    <Views />
  </BrowserRouter>
)

ReactDOM.render(root, document.getElementById('root'))

if (import.meta.hot) {
  // Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
  // Learn more: https://www.snowpack.dev/#hot-module-replacement
  import.meta.hot.accept()
}
