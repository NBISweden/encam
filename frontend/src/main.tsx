declare const module: {hot?: {accept: Function}}
module.hot && module.hot.accept()

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {Views} from './Views'
import {CssBaseline} from '@material-ui/core'

const root = document.querySelector('#root')

const view = <>
  <Views/>
  <CssBaseline/>
</>

ReactDOM.render(view, root)


