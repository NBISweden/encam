declare const module: {hot?: {accept: Function}}
module.hot && module.hot.accept()

import * as React from 'react'
import * as ReactDOM from 'react-dom'

import {css, div} from './css'

import Splash, * as splash from './splash'

import * as vp from './vegaplots'

import {Boxplot} from './boxplots'

import boxplot_json from './boxplot.json'

import * as form from './form'

import * as backend from './backend'

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

  const [filter, set_filter] = React.useState(undefined as undefined | Record<string, any>)
  const [plot_data, set_plot_data] = React.useState(undefined as any)
  const plot = React.useMemo(
    () => {
      if (filter && plot_data) {
        return <Boxplot key={JSON.stringify(filter)} data={plot_data} facet0={filter.cells.length != 0 ? 'tumor' : 'cell'} />
      }
    },
    [filter, plot_data, vp.Boxplot]
  )
  return (
    <React.Fragment>
      {plot}
      {conf
        ? <form.Form conf={conf} onSubmit={(filter, expand_result) => {
            console.log('filter:', filter)
            set_filter(filter)
            backend.request('filter', filter).then(res => {
              set_filter(filter)
              const expanded = expand_result(filter, res)
              set_plot_data(expanded)
            })
          }}/>
        : <i>Loading form...</i>}
    </React.Fragment>
  )
}

// ReactDOM.render(<Splash/>, document.querySelector('#root'))
ReactDOM.render(Centered(<FormAndPlot/>), document.querySelector('#root'))
// ReactDOM.render(Root(), document.querySelector('#root'))
// import * as domplots from './domplots'
// ReactDOM.render(<domplots.Demo/>, document.querySelector('#root'))
