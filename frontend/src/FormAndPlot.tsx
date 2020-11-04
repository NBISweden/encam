import * as ReactDOM from 'react-dom'
import * as React from 'react'
import * as backend from './backend'

import * as ui from './ui_utils'

import {BoxplotWithControls} from './BoxplotWithControls'
import {KMPlotWithControls} from './KMPlotWithControls'
import * as form from './Form'

import {LoadingPlot, FormAndPlotView} from './FormAndPlotView'

export function FormAndKMPlot() {
  const conf = backend.useRequest('configuration')

  const [filter, set_filter] = React.useState(undefined as undefined | Record<string, any>)

  ui.useWhyChanged(FormAndKMPlot, {conf, filter})
  return (
    <FormAndPlotView
      form={conf && <form.KMForm conf={conf} onSubmit={set_filter} />}
      plot={filter && <KMPlotWithControls filter={filter} />}
    />
  )
}

export function FormAndBoxPlot(props: {form?: typeof form.Form}) {
  const Form = props.form || form.Form
  const conf = backend.useRequest('configuration')

  const [filter, set_filter] = React.useState(undefined as undefined | Record<string, any>)
  const [plot_data, set_plot_data] = React.useState(undefined as any)
  const [loading_outer, set_loading_outer] = React.useState(false)
  const [loading_inner, set_loading_inner] = React.useState(false)
  const plot = filter && plot_data && (
    <BoxplotWithControls
      data={plot_data}
      facet={filter.facet}
      key={filter.facet}
      set_loading={set_loading_inner}
    />
  )
  const request = backend.useRequestFn()
  const onSubmit = React.useCallback(async (...filters) => {
    set_loading_outer(true)
    // console.time('request')
    const res: any[][] = await request('tukey', filters)
    // console.timeEnd('request')
    const names = ['A', 'B']
    const res_with_named_groups = res.flatMap((r, i) =>
      r.map(row => ({
        ...row,
        group: names[i],
      }))
    )
    ReactDOM.unstable_batchedUpdates(() => {
      set_loading_outer(false)
      set_filter(filters[0])
      set_plot_data(res_with_named_groups)
    })
  }, [])
  const loading = loading_outer || (filter && plot_data && loading_inner)
  ui.useWhyChanged(FormAndBoxPlot, {conf, filter, plot_data, loading, plot})
  return (
    <FormAndPlotView
      form={conf && <Form key="form" conf={conf} onSubmit={onSubmit} />}
      plot={<LoadingPlot plot={plot} loading={loading} />}
    />
  )
}

import stories from '@app/ui_utils/stories'

stories(add => {
  add(<FormAndBoxPlot />)
  add({Grouped: <FormAndBoxPlot form={form.TwoForms} />})
  add(<FormAndKMPlot />)
})
