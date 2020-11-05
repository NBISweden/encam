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

import {render, fireEvent, screen, within, waitFor} from '@testing-library/react'

const {click} = fireEvent
const {getByLabelText} = screen

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
  const ref = React.useRef(null)
  return (
    <>
      {false && (
        <button
          onClick={() => {
            click(within(ref.current as any).getByText(/plot/i))
          }}>
          boo
        </button>
      )}
      <div ref={ref}>
        <FormAndPlotView
          form={conf && <Form key="form" conf={conf} onSubmit={onSubmit} />}
          plot={<LoadingPlot plot={plot} loading={loading} />}
        />
      </div>
    </>
  )
}

import stories from '@app/ui_utils/stories'

stories(add => {
  add(<FormAndBoxPlot />)

  let calls = 0

  add(<FormAndBoxPlot />)
    .wrap(
      backend.mock(async (endpoint: string, body: any) => {
        console.log('calling woop woop', endpoint, body)
        calls++
        const {form_test_conf} = await import('../src/data/form')
        const {grouped_rows} = await import('../src/data/boxplot')
        if (endpoint == 'configuration') {
          expect(body).toBeUndefined()
          return form_test_conf
        } else if (endpoint == 'tukey') {
          expect(body).toBeDefined()
          return grouped_rows
        }
        throw new Error(`Unsupported endpoint ${endpoint}`)
      })
    )
    .test('pressing plot calls backend and makes a plot', async (expect, q) => {
      const {fireEvent, screen, waitFor} = q
      const {click} = fireEvent
      const {getByLabelText} = screen

      await waitFor(() => screen.getByText(/plot/i))

      const init_calls = calls

      click(screen.getByText(/plot/i))

      await waitFor(() => getByLabelText('Vega visualization'))

      expect(calls).toBe(init_calls + 1)
    })

  add({Grouped: <FormAndBoxPlot form={form.TwoForms} />})

  add(<FormAndKMPlot />)
})
