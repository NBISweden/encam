import * as ReactDOM from 'react-dom'
import * as React from 'react'
import {backend} from './backend'

import {css, div} from './ui_utils'

import * as ui from './ui_utils'

import {BoxplotWithControls} from './BoxplotWithControls'
import * as form from './Form'

import {CircularProgress} from '@material-ui/core'

export function FormAndBoxPlot(props: {form?: typeof form.Form, backend?: typeof backend}) {
  const the_backend = props.backend || backend
  const Form = props.form || form.Form
  const conf = the_backend.useRequest('configuration')

  const [filter, set_filter] = React.useState(undefined as undefined | Record<string, any>)
  const [plot_data, set_plot_data] = React.useState(undefined as any)
  const [loading, set_loading] = React.useState(false)
  const plot = filter && plot_data && <BoxplotWithControls key="plot" data={plot_data} facet={filter.facet} />
  const onSubmit = React.useCallback(
    (...filters) => {
      set_loading(true)
      // console.time('request')
      the_backend.request('tukey', filters).then((res: any[][]) => {
        // console.timeEnd('request')
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
  ui.useWhyChanged('FormAndBoxPlot', {conf, filter, plot_data, loading, plot, onSubmit})
  return div(
    css`
      & > :not(:first-child) {
        margin-left: 0;
      }
      display: flex;
      flex-direction: row;
      align-items: flex-start;
    `,
    <ui.Paper key="form" style={conf ? {width: '15cm', flexShrink: 0} : {}}
      css="
        & h2:first-child {
          margin-top: 0;
        }
      ">
      {conf
        ? <Form key="form" conf={conf} onSubmit={onSubmit}/>
        : <CircularProgress />}
    </ui.Paper>,
    (plot || loading) && <ui.Paper key="plot" style={{width: 'fit-content', position: 'relative'}}>
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
    </ui.Paper>
  )
}

