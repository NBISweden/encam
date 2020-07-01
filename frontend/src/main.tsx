declare const module: {hot?: {accept: Function}}
module.hot && module.hot.accept()

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {Views} from './Views'

const root = document.querySelector('#root')

const view = <Views />

import * as R from 'react-router-dom'

ReactDOM.render(<R.BrowserRouter>{view}</R.BrowserRouter>, root)