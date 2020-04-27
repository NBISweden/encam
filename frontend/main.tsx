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

function Centered(d: React.ReactNode) {
  return <div id="top" className="row">
    <splash.GlobalStyle/>
    <div id="center" style={{padding: 10}}>
      {d}
    </div>
  </div>
}

function FormAndPlot() {
  // console.log('new form and plot')
  const conf = backend.useRequest('configuration')
  // console.log(conf)

  const [filter, set_filter] = React.useState(undefined as undefined | Record<string, any>)
  const [plot_data, set_plot_data] = React.useState(undefined as any)
  // console.log(JSON.stringify(filter, 2, 2))
  const plot = React.useMemo(
    () => plot_data && <React.Fragment>
      <vp.Boxplot
        data={plot_data}
        options={
          {
            landscape: true,
            inner: 'tumor',
            facet: ['cell', 'location'],
            color: 'tumor',
            stripes: 'location',
          }
        }/>
      <vp.Boxplot
        data={plot_data}
        options={
          {
            landscape: true,
            inner: 'location',
            facet: ['tumor', 'cell'],
            color: 'cell',
            stripes: 'location',
          }
        }/>
      <vp.Boxplot
        data={plot_data}
        options={
          {
            landscape: true,
            inner: ['cell', 'location'],
            facet: ['tumor'],
            color: 'cell',
            stripes: 'location',
          }
        }/>
      <vp.Boxplot
        data={plot_data}
        options={
          {
            landscape: true,
            inner: 'location',
            facet: ['cell', 'tumor'],
            color: 'cell',
            stripes: 'location',
          }
        }/>
    </React.Fragment>,
    [plot_data, vp.Boxplot]
  )
  return (
    <React.Fragment>
      {plot}
      {conf
        ? <form.Form conf={conf} onSubmit={(filter, expand_result) => {
            console.log('filter:', filter)
            console.log(JSON.stringify(filter, 2, 2))
            set_filter(filter)
            backend.request('filter', filter).then(res => {
              set_filter(filter)
              console.log(res[0])
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
