import * as ReactDOM from 'react-dom'
import * as React from 'react'
import * as backend from './backend'

import * as ui from './ui_utils'
import * as utils from './utils'

import {VegaKMPlot, KMRow} from './VegaKMPlot'
import {VegaCumulativeCount, cucount, slider_max, bin_sizes, Row} from './VegaCumulativeCount'

import {Slider} from '@material-ui/core'

import {makeStyles} from '@material-ui/core/styles'

import {LoadingPlot} from './FormAndPlotUI'

import {within, render, fireEvent, screen} from '@testing-library/react'

const useStyles = makeStyles({
  KMPlotWithControls: {
    ...ui.flex_column,

    // Radio buttons:
    '& .MuiFormGroup-root': {
      ...ui.flex_row,
    },
  },
})

interface State {
  expr_data: undefined | number[]
  cu_data: undefined | Row[]
  plot_data: undefined | KMRow[]
  cutoffs: number[]
  filter: Record<string, any>
  location: string
  num_groups: number
  loading: boolean
}

const init_state: State = {
  expr_data: undefined,
  cu_data: undefined,
  plot_data: undefined,
  cutoffs: [],
  filter: {},
  location: 'Tumor',
  num_groups: 2,
  loading: false,
}

type Message =
  | {type: 'update'; values: Partial<State>}
  | {type: 'reply'; endpoint: 'expression'; value: any}
  | {type: 'reply'; endpoint: 'survival'; value: any}

type Request = [string, any]

export function next(start: State, msg: Message): readonly [State, ...Request[]] {
  const reqs = [] as Request[]

  let next = {...start}

  if (msg.type === 'update') {
    next = {...next, ...msg.values}
  }

  {
    const diff = utils.simple_object_diff(start, next)

    if (diff.filter || diff.location) {
      const filter_full = {
        ...next.filter,
        cell_full: next.filter.cell + '_' + next.location.toUpperCase(),
      }
      reqs.push(['expression', filter_full])
      next.loading = true
    }
    if (msg.type === 'reply' && msg.endpoint === 'expression') {
      next.loading = false
      const next_expr_data = msg.value
      if (!next_expr_data.length) {
        next.plot_data = undefined
      }
      if (!next.expr_data || next.expr_data.length !== next_expr_data.length) {
        next.cutoffs = []
      }
      next.expr_data = next_expr_data
    }
  }

  {
    const diff = utils.simple_object_diff(start, next)

    if (start.expr_data !== next.expr_data || diff.cutoffs) {
      if (next.expr_data) {
        next.cu_data = cucount(next.expr_data, next.cutoffs)
      } else {
        next.cu_data = undefined
      }
    }
  }

  {
    const diff = utils.simple_object_diff(start, next)

    // update cutoffs if num_groups or the data was changed

    if (diff.cu_data || diff.num_groups) {
      const {cu_data, num_groups, cutoffs, expr_data} = next
      if (expr_data && cu_data && cu_data.length) {
        const wrong_length = num_groups - 1 != cutoffs.length
        const aligned = cutoffs.every(c => cu_data.some(d => d.cucount === c))
        if (wrong_length || !aligned) {
          const cutoff = (i: number) => {
            const r = (i + 1) / num_groups
            return r * cu_data.slice(-1)[0].cucount
          }
          const proto = wrong_length ? utils.enumTo(num_groups - 1).map(cutoff) : cutoffs
          const max = slider_max(cu_data)
          const next_cutoffs = utils.snap(
            proto,
            cu_data.map(d => d.cucount).filter(cucount => cucount > 0 && cucount <= max)
          )
          if (!utils.equal(cutoffs, next_cutoffs)) {
            next.cutoffs = next_cutoffs
            next.cu_data = cucount(expr_data, next_cutoffs)
          }
        }
      }
    }
  }

  if (start.cu_data !== next.cu_data) {
    const {cu_data, filter, location} = next
    if (cu_data && cu_data.length) {
      // when we slide around the cutoffs request new survival calculation
      const group_sizes = bin_sizes(cu_data)
      const filter_full = {
        ...filter,
        cell_full: filter.cell + '_' + location.toUpperCase(),
        group_sizes,
        num_groups: group_sizes.length,
      }
      next.loading = true
      reqs.push(['survival', {...filter_full, group_sizes}])
    }
  }

  if (msg.type === 'reply' && msg.endpoint === 'survival') {
    next.loading = false
    next.plot_data = msg.value.points
  }

  const ret = [next, ...reqs] as const
  // console.group(msg.type)
  // console.log(start)
  // console.log(msg)
  // console.log(next)
  // console.log(...reqs)
  // console.groupEnd()
  return ret
}

export function KMPlotWithControls({filter}: {filter: Record<string, any>}) {
  const [state, set_state] = React.useState(init_state as State)

  const request_fn = backend.useRequestFn()

  function request(endpoint: string, body: any) {
    request_fn(endpoint, body).then(value =>
      dispatch({type: 'reply', endpoint: endpoint as any, value})
    )
  }

  const [surv, enqueue_surv] = ui.useDelayed(400, undefined as any)

  function dispatch(m: Message) {
    set_state(state => {
      const [next_state, ...reqs] = next(state, m)
      reqs.forEach(([endpoint, body]) => {
        if (endpoint === 'survival') {
          enqueue_surv({body})
        } else {
          request(endpoint, body)
        }
      })
      return next_state
    })
  }

  React.useEffect(() => {
    if (surv) {
      enqueue_surv(undefined)
      request('survival', surv.body)
    }
  }, [surv])

  const [location, location_node] = ui.useRadio('Location', ['Tumor', 'Stroma'])
  const [num_groups_str, num_groups_node] = ui.useRadio('Groups', ['2', '3', '4'])
  const num_groups = Number(num_groups_str)

  React.useLayoutEffect(() => dispatch({type: 'update', values: {location, num_groups, filter}}), [
    location,
    num_groups,
    filter,
  ])

  const set_cutoffs: ui.Setter<number[]> = cutoffs => dispatch({type: 'update', values: {cutoffs}})

  return <KMPlotWithControlsUI {...{location_node, num_groups_node, set_cutoffs, ...state}} />
}

interface PropsUI {
  cu_data: undefined | Row[]
  plot_data: undefined | KMRow[]

  cutoffs: number[]
  set_cutoffs: ui.Setter<number[]>

  location_node: React.ReactNode
  num_groups_node: React.ReactNode
  loading: boolean
}

export function KMPlotWithControlsUI(props: PropsUI) {
  const {cu_data, plot_data, cutoffs, set_cutoffs, loading} = props

  const [options, opt_nodes] = ui.record({
    ci: ui.useCheckbox('show confidence intervals (95%)', true),
  })

  const classes = useStyles()

  const plot =
    cu_data && cu_data.length == 0 ? (
      <>No records with the given filter.</>
    ) : (
      <div className={classes.KMPlotWithControls}>
        <div style={{marginLeft: 30, ...ui.flex_column}}>
          {props.location_node}
          {plot_data && opt_nodes}
        </div>
        {plot_data && <VegaKMPlot data={plot_data} options={options} />}
        {cu_data && cu_data.length > 0 && (
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
                max={cu_data.slice(-1)[0].cucount}
                value={cutoffs}
                onChange={(_, vs) => Array.isArray(vs) && set_cutoffs(vs)}
                valueLabelDisplay="on"
                marks={cu_data.slice(0, -2).map(x => ({value: x.cucount}))}
                step={null}
                track={false}
              />
              {props.num_groups_node}
              {utils.equal(utils.uniq(cutoffs), cutoffs) || (
                <div>Warning: overlapping cutoffs</div>
              )}{' '}
            </div>
          </div>
        )}
      </div>
    )

  return <LoadingPlot loading={loading} plot={plot} />
}
