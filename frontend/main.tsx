declare const module: {hot?: {accept: Function}}
module.hot && module.hot.accept()

import * as React from 'react'
import * as ReactDOM from 'react-dom'

import {css, div} from './css'

import Splash, * as splash from './splash'

import * as vp from './vegaplots'

import boxplot_json from './boxplot.json'

import * as form from './form'

import * as backend from './backend'

function Boxplots() {
  return Centered(
    vp.boxplot(boxplot_json, {facet: "Tumor_type_code", horizontal: false})
  )
}

function Centered(d: React.ReactNode) {
  return <div id="top" className="row">
    <splash.GlobalStyle/>
    <div id="center" style={{padding: 10}}>
      {d}
    </div>
  </div>
}

function FormAndPlot() {
  const conf = backend.useRequest('configuration')
  console.log('eh')

  const [filter, set_filter] = React.useState(undefined)
  // console.log(JSON.stringify(filter, 2, 2))
  const plot = React.useMemo(
    () => filter && vp.boxplot(boxplot_json, {facet: "Tumor_type_code", horizontal: false}),
    [filter]
  )
  return (
    <React.Fragment>
      {conf
        ? <form.Form conf={conf} onSubmit={set_filter}/>
        : <i>Loading form...</i>}
      {plot}
    </React.Fragment>
  )
}

ReactDOM.render(<Splash/>, document.querySelector('#root'))
// ReactDOM.render(Centered(<FormAndPlot/>), document.querySelector('#root'))
// ReactDOM.render(Boxplots(), document.querySelector('#root'))
// ReactDOM.render(Root(), document.querySelector('#root'))
// import * as domplots from './domplots'
// ReactDOM.render(<domplots.Demo/>, document.querySelector('#root'))
