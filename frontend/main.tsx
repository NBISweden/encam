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

import * as utils from './utils'

function Centered(d: React.ReactNode) {
  return <div id="top" className="row">
    <splash.GlobalStyle/>
    <div id="center" style={{padding: 10}}>
      {d}
    </div>
  </div>
}

import {LinearProgress, CircularProgress} from '@material-ui/core'

function FormAndPlot() {
  const conf = backend.useRequest('configuration')

  const [filter, set_filter] = React.useState(undefined as undefined | Record<string, any>)
  const [plot_data, set_plot_data] = React.useState(undefined as any)
  const [loading, set_loading] = React.useState(false)
  const plot = filter && plot_data && <Boxplot key="plot" data={plot_data} facet={filter.facet} />
  const onSubmit = React.useCallback(
    filter => {
      console.log('filter:', filter)
      set_loading(true)
      console.time('request')
      backend.request('tukey', [filter]).then(res => {
        console.timeEnd('request')
        console.log('res:', res[0])
        ReactDOM.unstable_batchedUpdates(() => {
          set_loading(false)
          set_filter(filter)
          set_plot_data(res[0])
        })
      })
    },
    [])
  utils.useWhyChanged('FormAndPlot', {conf, filter, plot_data, loading, plot, onSubmit})
  return div(
    css`
      body {
        background: #ccc;
      }
      & > div:not(:first-child) {
        margin-left: 0;
      }
      & > div {
        padding: 0.5cm;
        margin: 0.5cm;
        background: #fff;
        border: 1px #aaa solid;
        border-radius: 5px;
      }
      & {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
      }
    `,
    <div key="form" style={conf ? {width: '17cm'} : {}}>
      {conf
        ? <form.Form key="form" conf={conf} onSubmit={onSubmit}/>
        : <CircularProgress />}
    </div>,
    (plot || loading) && <div key="plot" style={{width: 'fit-content', position: 'relative'}}>
      {loading &&
        <div
          style={plot ? {
            position: 'absolute',
            right: 0,
            top: 0,
            margin: 20,
            background: '#fffe',
            boxShadow: '0 0 8px 8px #fffe',
          } : {}}>
          <CircularProgress/>
        </div>}
      {plot}
    </div>
  )
}

// ReactDOM.render(<Splash/>, document.querySelector('#root'))
ReactDOM.render(<FormAndPlot/>, document.querySelector('#root'))
// ReactDOM.render(Root(), document.querySelector('#root'))
// import * as domplots from './domplots'
// ReactDOM.render(<domplots.Demo/>, document.querySelector('#root'))
