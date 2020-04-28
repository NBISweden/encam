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
        return <Boxplot key={filter.facet} data={plot_data} facet0={filter.facet} />
      }
    },
    [filter, plot_data, vp.Boxplot]
  )
  return div(
    css`
      body {
        background: #ccc;
      }
      & > div {
        padding: 0.5cm;
        margin: 0.5cm auto;
        background: #fff;
        border: 1px #aaa solid;
        border-radius: 5px;
      }
      & {
        display: flex;
        flex-direction: column;
      }
    `,
    <div style={{maxWidth: '18cm'}}>
      {conf
        ? <form.Form conf={conf} onSubmit={filter => {
            console.log('filter:', filter)
            backend.request('filter', [filter]).then(res => {
              console.log('res:', res[0])
              set_filter(filter)
              // const expanded = expand_result(filter, res)
              set_plot_data(res[0])
            })
          }}/>
        : <i>Loading form...</i>}
    </div>,
    plot && <div style={{width: 'fit-content'}}>
      {plot}
    </div>
  )
}

// ReactDOM.render(<Splash/>, document.querySelector('#root'))
ReactDOM.render(<FormAndPlot/>, document.querySelector('#root'))
// ReactDOM.render(Root(), document.querySelector('#root'))
// import * as domplots from './domplots'
// ReactDOM.render(<domplots.Demo/>, document.querySelector('#root'))
