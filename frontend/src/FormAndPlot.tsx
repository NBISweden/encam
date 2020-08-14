import * as ReactDOM from 'react-dom'
import * as React from 'react'
import * as backend from './backend'

import * as ui from './ui_utils'
import * as utils from './utils'

import {BoxplotWithControls} from './BoxplotWithControls'
import {VegaKMPlot, Points} from './VegaKMPlot'
import {VegaCumulativeCount, cucount, Row} from './VegaCumulativeCount'
import * as form from './Form'

import {CircularProgress} from '@material-ui/core'

import {makeStyles} from '@material-ui/core/styles'

const useStyles = makeStyles({
  FormAndPlot: {
    ...ui.flex_row,
    alignItems: 'flex-start',
    '& > :not(:first-child)': {
      marginLeft: 0,
    },
  },
  Reloading: {
    position: 'relative',
    '& > *': {
      position: 'absolute',
      right: 0,
      top: 0,
      background: '#fffe',
      boxShadow: '0 0 8px 8px #fffe',
    },
  },
  KMPlotWithControls: {
    ...ui.flex_column,

    // Radio buttons:
    '& .MuiFormGroup-root': {
      ...ui.flex_row,
    },
  },
})

export function Loading({reloading = false}) {
  const classes = useStyles()
  return (
    <div className={reloading ? classes.Reloading : undefined}>
      <div>
        <CircularProgress />
      </div>
    </div>
  )
}

export function LoadingPlot({plot = undefined as React.ReactNode, loading = false}) {
  return (
    (plot || loading) && (
      <ui.Paper key="plot" style={{width: 'fit-content'}}>
        {loading && <Loading reloading={!!plot} />}
        {plot}
      </ui.Paper>
    )
  )
}

export function FormAndPlotUI({
  form = undefined as React.ReactNode,
  plot = undefined as React.ReactNode,
}) {
  const classes = useStyles()
  return (
    <div className={classes.FormAndPlot}>
      <ui.Paper key="form" style={form ? {width: '15cm', flexShrink: 0} : {}}>
        {form || <CircularProgress />}
      </ui.Paper>
      {plot}
    </div>
  )
}

export function FormAndKMPlot() {
  const conf = backend.useRequest('configuration')

  const [filter, set_filter] = React.useState(undefined as undefined | Record<string, any>)

  ui.useWhyChanged(FormAndKMPlot, {conf, filter})
  return (
    <FormAndPlotUI
      form={conf && <form.KMForm conf={conf} onSubmit={set_filter} />}
      plot={<KMPlotWithControls filter={filter} />}
    />
  )
}

import {Slider} from '@material-ui/core'

export function KMPlotWithControls({filter = undefined as undefined | Record<string, any>}) {
  const [location, location_node] = ui.useRadio('Location', ['Tumor', 'Stroma'])
  const [num_groups_str, num_groups_node] = ui.useRadio('Groups', ['2', '3', '4'])
  const num_groups = Number(num_groups_str)

  const [plot_data, set_plot_data] = React.useState(undefined as any)
  const [expr_data, set_expr_data] = React.useState(undefined as undefined | number[])
  const [loading, set_loading] = React.useState(false)

  const request = backend.useRequestFn()

  const [cutoffs, set_cutoffs] = React.useState([] as number[])

  const cu_max = (cu_data: Row[]) => cu_data.slice(-1)[0].cucount

  ui.useAsync(async () => {
    if (filter) {
      const filter_full = {
        ...filter,
        group_sizes: null,
        cell_full: filter.cell + '_' + location.toUpperCase(),
        // num_groups,
      }
      console.time('expression')
      const next_expr_data = await request('expression', filter_full)
      console.timeEnd('expression')
      ReactDOM.unstable_batchedUpdates(() => {
        set_expr_data(next_expr_data)
        if (!expr_data || expr_data.length != next_expr_data) {
          set_cutoffs([])
        }
      })
    }
  }, [filter, location])

  React.useLayoutEffect(() => {
    if (expr_data) {
      const cu_data = cucount(expr_data, cutoffs)
      const max = cu_max(cu_data)
      const cutoff = (i: number) => {
        const r = (i + 1) / num_groups
        return Math.round(r * max)
      }
      const next_cutoffs = utils.enumTo(num_groups - 1).map(cutoff)
      if (!cu_data || num_groups - 1 != cutoffs.length) {
        set_cutoffs(next_cutoffs)
      }
    }
  }, [expr_data, num_groups])

  ui.useDebounce(
    400,
    React.useCallback(async () => {
      if (filter && cutoffs.length && expr_data) {
        const cu_data = cucount(expr_data, cutoffs)
        set_loading(true)
        const cutoffs_sorted = [...cutoffs.sort(utils.by(x => x)), cu_max(cu_data)]
        // [100, 120, max]
        // [0 - 100, 120 - 20, max - 120]
        const group_sizes = cutoffs_sorted.map((v, i, a) => v - (a[i - 1] || 0))
        console.time('survival')
        console.log(cutoffs_sorted)
        console.log(group_sizes)
        const filter_full = {
          ...filter,
          group_sizes,
          cell_full: filter.cell + '_' + location.toUpperCase(),
          num_groups: group_sizes.length,
        }
        let res = undefined as any
        try {
          res = await request('survival', {
            ...filter_full,
            group_sizes,
          })
        } catch {
          ReactDOM.unstable_batchedUpdates(() => {
            set_loading(false)
            set_plot_data(undefined)
          })
          return
        }
        console.timeEnd('survival')
        console.log({res})
        ReactDOM.unstable_batchedUpdates(() => {
          set_loading(false)
          set_plot_data(res.points)
        })
      } else {
        set_loading(false)
      }
    }, [filter, location, utils.str(cutoffs)])
  )

  const cu_data = expr_data && cucount(expr_data, cutoffs)

  const classes = useStyles()
  const plot = (plot_data || cu_data) && (
    <div className={classes.KMPlotWithControls}>
      <div style={{marginLeft: 30}}>{location_node}</div>
      {plot_data && <VegaKMPlot points={plot_data} />}
      {cu_data && (
        <div>
          <VegaCumulativeCount data={cu_data} />
          <div style={{marginLeft: 40, width: 400}}>
            <p id="cutoffs-slider" style={{fontWeight: 700}}>
              cumulative count cutoffs:
            </p>
            <Slider
              style={{marginTop: 30}}
              aria-labelledby="cutoffs-slider"
              min={0}
              max={cu_max(cu_data)}
              value={cutoffs}
              onChange={(_, vs) => Array.isArray(vs) && set_cutoffs(vs)}
              valueLabelDisplay="on"
            />
            {num_groups_node}
          </div>
        </div>
      )}
    </div>
  )

  ui.useWhyChanged(KMPlotWithControls, {filter, plot_data, loading, location, num_groups})
  return <LoadingPlot loading={loading} plot={plot} />
}

export function FormAndBoxPlot(props: {form?: typeof form.Form}) {
  const Form = props.form || form.Form
  const conf = backend.useRequest('configuration')

  const [filter, set_filter] = React.useState(undefined as undefined | Record<string, any>)
  const [plot_data, set_plot_data] = React.useState(undefined as any)
  const [loading, set_loading] = React.useState(false)
  const plot = filter && plot_data && <BoxplotWithControls data={plot_data} facet={filter.facet} />
  const request = backend.useRequestFn()
  const onSubmit = React.useCallback(async (...filters) => {
    set_loading(true)
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
      set_loading(false)
      set_filter(filters[0])
      set_plot_data(res_with_named_groups)
    })
  }, [])
  ui.useWhyChanged(FormAndBoxPlot, {conf, filter, plot_data, loading, plot})
  return (
    <FormAndPlotUI
      form={conf && <Form key="form" conf={conf} onSubmit={onSubmit} />}
      plot={<LoadingPlot plot={plot} loading={loading} />}
    />
  )
}
