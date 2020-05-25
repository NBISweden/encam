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
import * as mui from '@material-ui/core'

import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import ExpandLessIcon from '@material-ui/icons/ExpandLess'

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
        console.log(JSON.stringify(res))
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
      & > :not(:first-child) {
        margin-left: 0;
      }
      display: flex;
      flex-direction: row;
      align-items: flex-start;
    `,
    <Paper key="form" style={conf ? {width: '15cm', flexShrink: 0} : {}}
      css="
        & h2:first-child {
          margin-top: 0;
        }
      ">
      {conf
        ? <form.TwoForms key="form" conf={conf} onSubmit={onSubmit}/>
        : <CircularProgress />}
    </Paper>,
    (plot || loading) && <Paper key="plot" style={{width: 'fit-content', position: 'relative'}}>
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
    </Paper>
  )
}

import styled from 'styled-components'

type WithCss<A> = A extends (props : infer P) => JSX.Element ? (props: P & {css?: string}) => JSX.Element : never

const Paper = styled(mui.Paper as WithCss<typeof mui.Paper>).attrs(() => ({
  // variant: 'outlined',
  elevation: 2,
}))`
  margin: 20;
  padding: 20;
  ${props => props.css || ''}
`

import {Explore} from './explore'
import * as boxplot_data from './boxplot_data'

const root = document.querySelector('#root')
const render = (e: React.ReactElement) => ReactDOM.render(e, root)

// render(<FormAndPlot/>)
// render(<Splash/>)
render(<Paper><Boxplot data={boxplot_data.boxplot_data} facet="cell"/></Paper>)

// render(<Explore/>)
// render(Root())
// import * as domplots from './domplots'
// render(<domplots.Demo/>)
