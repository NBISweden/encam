import 'core-js/features/array/flat-map'
import 'core-js/features/array/flat'
import 'core-js/features/array/from'
import 'core-js/features/object/entries'
import 'core-js/features/object/from-entries'

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

import.meta?.hot?.accept() // React fast refresh, OK to ignore esbuild warning
