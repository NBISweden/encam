declare const module: {hot?: {accept: Function}}
module.hot && module.hot.accept()

import * as React from 'react'
import * as ReactDOM from 'react-dom'

import {css, div} from './css'

import Splash, * as splash from './splash'

import {Boxplot} from './boxplots'

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

import {CircularProgress} from '@material-ui/core'

function FormAndPlot() {
  const conf = backend.useRequest('configuration')

  const [filter, set_filter] = React.useState(undefined as undefined | Record<string, any>)
  const [plot_data, set_plot_data] = React.useState(undefined as any)
  const [loading, set_loading] = React.useState(false)
  const plot = filter && plot_data && <Boxplot key="plot" data={plot_data} facet={filter.facet} />
  const onSubmit = React.useCallback(
    (...filters) => {
      // console.log('filter:', filters)
      set_loading(true)
      console.time('request')
      backend.request('tukey', filters).then((res: any[][]) => {
        console.timeEnd('request')
        // console.log('res:', res[0])
        // console.log(res)
        // if (filters.length > 1) {
        //   const facet = filters[0].facet
        //   const opp = facet === 'tumor' ? 'cell' : 'tumor'
        //   console.log({res})
        // }
        const names = ['A', 'B']
        res = res.flatMap((r, i) => r.map(row => ({
          ...row,
          group: names[i],
        })))
        ReactDOM.unstable_batchedUpdates(() => {
          set_loading(false)
          set_filter(filters[0])
          set_plot_data(res)
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
      & h2:first-child {
        margin-top: 0;
      }
    `,
    <div key="form" style={conf ? {width: '15cm', flexShrink: 0} : {}}>
      {conf
        ? <form.TwoForms key="form" conf={conf} onSubmit={onSubmit}/>
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
