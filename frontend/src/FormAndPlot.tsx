import * as ReactDOM from 'react-dom'
import * as React from 'react'
import * as backend from './backend'

import * as ui from './ui_utils'

import {BoxplotWithControls} from './BoxplotWithControls'
import {VegaKMPlot} from './VegaKMPlot'
import * as form from './Form'

import {CircularProgress} from '@material-ui/core'

import {makeStyles} from '@material-ui/core/styles'

const useStyles = makeStyles({
  FormAndBoxPlot: {
    ...ui.flex_row,
    alignItems: 'flex-start',
    '& > :not(:first-child)': {
      marginLeft: 0,
    },
  },
  Reloading: {
    position: 'absolute',
    right: 0,
    top: 0,
    margin: 20,
    background: '#fffe',
    boxShadow: '0 0 8px 8px #fffe',
  }
})

export function FormAndPlotUI(props: {form?: React.ReactNode, plot?: React.ReactNode, loading?: boolean}) {
  const {form, plot, loading} = props
  const classes = useStyles()
  return (
    <div className={classes.FormAndBoxPlot}>
      <ui.Paper key="form" style={form ? {width: '15cm', flexShrink: 0} : {}}>
        {form || <CircularProgress />}
      </ui.Paper>
      {(plot || loading) && (
        <ui.Paper key="plot" style={{width: 'fit-content', position: 'relative'}}>
          {loading && (
            <div className={plot && classes.Reloading || ''}>
              <CircularProgress />
            </div>
          )}
          {plot}
        </ui.Paper>
      )}
    </div>
  )}

export function FormAndKMPlot() {
  const conf = backend.useRequest('configuration')

  const [plot_data, set_plot_data] = React.useState(undefined as any)
  const [loading, set_loading] = React.useState(false)
  const plot = plot_data && ( <VegaKMPlot points={plot_data} /> )
  const request = backend.useRequestFn()
  const onSubmit = React.useCallback(filter => {
    set_loading(true)
    console.time('request')
    request('survival', filter).then((res: {points: any}) => {
      console.timeEnd('request')
      ReactDOM.unstable_batchedUpdates(() => {
        set_loading(false)
        set_plot_data(res.points)
      })
    })
  }, [])
  ui.useWhyChanged('FormAndKMBoxPlot', {conf, plot_data, loading, plot})
  return <FormAndPlotUI
    form={conf && <form.KMForm conf={conf} onSubmit={onSubmit} />}
    plot={plot}
    loading={loading}
  />
}

export function FormAndBoxPlot(props: {form?: typeof form.Form}) {
  const Form = props.form || form.Form
  const conf = backend.useRequest('configuration')

  const [filter, set_filter] = React.useState(undefined as undefined | Record<string, any>)
  const [plot_data, set_plot_data] = React.useState(undefined as any)
  const [loading, set_loading] = React.useState(false)
  const plot = filter && plot_data && (
    <BoxplotWithControls data={plot_data} facet={filter.facet} />
  )
  const request = backend.useRequestFn()
  const onSubmit = React.useCallback((...filters) => {
    set_loading(true)
    // console.time('request')
    request('tukey', filters).then((res: any[][]) => {
      // console.timeEnd('request')
      const names = ['A', 'B']
      const res_with_named_groups = res.flatMap((r, i) =>
        r.map(row => ({
          ...row,
          group: names[i],
        }))
      )
      ReactDOM.unstable_batchedUpdates(() => {
        set_loading(false)
        set_filter(filters[0])
        set_plot_data(res_with_named_groups)
      })
    })
  }, [])
  ui.useWhyChanged('FormAndBoxPlot', {conf, filter, plot_data, loading, plot})
  return <FormAndPlotUI
    form={conf && <Form key="form" conf={conf} onSubmit={onSubmit} />}
    plot={plot}
    loading={loading}
  />
}
