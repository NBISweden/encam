declare const module: {hot?: {accept: Function}}
module.hot && module.hot.accept()

import * as React from 'react'
import * as ReactDOM from 'react-dom'

import {css, div, clear as clear_css} from './css'
clear_css()

import Splash, * as splash from './splash'
splash.setup_css()

import * as vp from './vegaplots'

// import * as mup from '../made-up-data.csv'
// console.log(mup)

import {default as boxplot_json} from './boxplot.json'

// console.log(boxplot_json)

function drawit() {
  return
}

import * as form from './form'

function Boxplots() {
  return Centered(
    vp.boxplot(boxplot_json, {facet: "Tumor_type_code", horizontal: false})
  )
}

function Centered(d: React.ReactNode) {
  return <div id="top" className="row">
    <div id="center" style={{padding: 10}}>
      {d}
    </div>
  </div>
}

function FormAndPlot() {
  const [filter, set_filter] = React.useState(undefined)
  console.log(JSON.stringify(filter, 2, 2))
  const plot = React.useMemo(
    () => filter && vp.boxplot(boxplot_json, {facet: "Tumor_type_code", horizontal: false}),
    [filter]
  )
  return (
    <React.Fragment>
      <form.Form onSubmit={set_filter}/>
      {plot}
    </React.Fragment>
  )
}

ReactDOM.render(<Splash/>, document.querySelector('#root')
// ReactDOM.render(Centered(<FormAndPlot/>), document.querySelector('#root'))
// ReactDOM.render(Boxplots(), document.querySelector('#root'))
// ReactDOM.render(Root(), document.querySelector('#root'))
// ReactDOM.render(<Demo/>, document.querySelector('#root'))
