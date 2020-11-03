import * as React from 'react'
import * as backend from './backend'

import * as ui from './ui_utils'
import * as utils from './utils'

import {KMPlot, KMLiveRow, KMRow} from './Vega/KMPlot'
import {
  CumulativeCountPlot,
  cucount,
  slider_max,
  bin_sizes,
  CuRow,
} from './Vega/CumulativeCountPlot'

import {Slider} from '@material-ui/core'

import {css} from 'emotion'

import {LoadingPlot} from './FormAndPlotView'

export interface State {
  expr_data: undefined | number[]
  cu_data: undefined | CuRow[]
  plot_data: undefined | KMRow[]
  live_rows: undefined | KMLiveRow[]
  statistics: undefined | Statistics
  cutoffs: number[]
  filter: Record<string, any>
  location: string
  num_groups: number
  loading: boolean
}

export const init_state: State = {
  expr_data: undefined,
  cu_data: undefined,
  plot_data: undefined,
  live_rows: undefined,
  statistics: undefined,
  cutoffs: [],
  filter: {},
  location: 'Tumor',
  num_groups: 2,
  loading: false,
}

export interface Statistics {
  log_rank: {
    p_logrank: number
    test_statistic_logrank: number
  }
  cox_regression: {
    p: number
  }
}

export interface Survival extends Statistics {
  points: KMRow[]
  live_points: KMLiveRow[]
}

export type Message =
  | {type: 'update'; values: Partial<State>}
  | {type: 'reply'; endpoint: 'expression'; value: number[]}
  | {type: 'reply'; endpoint: 'survival'; value: Survival}

export type Request = [string, any]

export function next(start: State, msg: Message): readonly [State, ...Request[]] {
  const reqs = [] as Request[]

  let next: State = {...start}

  // Update the state directly when the user has changes some input
  if (msg.type === 'update') {
    next = {...next, ...msg.values}
  }

  {
    // Request new expression levels when the filter or location changes
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

  // Memoize the cumulative count data when the expression levels change
  if (start.expr_data !== next.expr_data || start.cutoffs !== next.cutoffs) {
    if (next.expr_data) {
      next.cu_data = cucount(next.expr_data, next.cutoffs)
    } else {
      next.cu_data = undefined
    }
  }

  {
    // Snap cutoffs when the data or the number of groups change

    const diff = utils.simple_object_diff(start, next)

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
      // Request new survival calculation when the cuttoffs have changed
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
    const {points, live_points, ...statistics} = msg.value
    next.plot_data = points
    next.live_rows = live_points
    next.statistics = statistics
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

  return <KMPlotWithControlsView {...{location_node, num_groups_node, set_cutoffs, ...state}} />
}

interface ViewProps {
  cu_data: undefined | CuRow[]
  plot_data: undefined | KMRow[]
  live_rows: undefined | KMLiveRow[]
  statistics: undefined | Statistics

  cutoffs: number[]
  set_cutoffs: ui.Setter<number[]>

  location_node: React.ReactNode
  num_groups_node: React.ReactNode
  loading: boolean
}

const classes = {
  KMPlotWithControlsView: css({
    ...ui.flex_column,

    // Radio buttons:
    '& .MuiFormGroup-root': {
      ...ui.flex_row,
    },
  }),
}

const schemes = `
  blues greens greys oranges purples reds blueGreen bluePurple greenBlue
  orangeRed purpleBlue purpleBlueGreen purpleRed redPurple yellowGreen
  yellowOrangeBrown yellowOrangeRed blueOrange brownBlueGreen purpleGreen
  purpleOrange redBlue redGrey yellowGreenBlue redYellowBlue redYellowGreen
  pinkYellowGreen spectral viridis magma inferno plasma rainbow sinebow
  browns tealBlues teals warmGreys goldGreen goldOrange goldRed lightGreyRed
  lightGreyTeal lightMulti lightOrange lightTealBlue darkBlue darkGold
  darkGreen darkMulti darkRed category10 category20 category20b category20c
  tableau10 tableau20 accent dark2 paired pastel1 pastel2 set1 set2 set3
`
  .trim()
  .split(/\s+/g)

export function KMPlotWithControlsView(props: ViewProps) {
  const {cu_data, plot_data, live_rows, cutoffs, set_cutoffs, loading, statistics} = props

  const [options, opt_nodes] = ui.record({
    color_scheme: ui.map(ui.useNativeSelect(schemes, 'viridis', 'Color scheme'), e => (
      <div style={{marginBottom: 4}}>{e}</div>
    )),
    color_scheme_reverse: ui.useCheckbox('reverse', false),
    ci: ui.useCheckbox('show confidence intervals (95%)', true),
  })

  const round = (x: number) => Math.round(x * 1000) / 1000

  const plot =
    cu_data && cu_data.length == 0 ? (
      <>No records with the given filter.</>
    ) : (
      <div className={classes.KMPlotWithControlsView}>
        <div style={{marginLeft: 40, ...ui.flex_column}}>
          {props.location_node}
          {plot_data && (
            <div style={{...ui.flex_row, justifyContent: 'space-between', alignItems: 'flex-end'}}>
              {opt_nodes}
            </div>
          )}
        </div>
        {plot_data && <KMPlot data={plot_data} live_rows={live_rows} options={options} />}
        {statistics && (
          <table
            style={{
              marginLeft: 'auto',
              marginRight: 50,
              marginTop: -20,
              marginBottom: 20,
              fontSize: '0.9em',
              width: 'max-content',
            }}>
            <tbody>
              <tr>
                <td>Logrank test statistic:</td>
                <td>{round(statistics.log_rank.test_statistic_logrank)}</td>
              </tr>
              <tr>
                <td>Logrank test p-value:</td>
                <td>{round(statistics.log_rank.p_logrank)}</td>
              </tr>
              <tr>
                <td>Cox regression p-value:</td>
                <td>{round(statistics.cox_regression.p)}</td>
              </tr>
            </tbody>
          </table>
        )}
        {cu_data && cu_data.length > 0 && (
          <div>
            <CumulativeCountPlot data={cu_data} options={options} />
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

import {MockBackend} from './backend'
import * as km_data from './data/kmplot'
import stories from '@app/ui_utils/stories'

stories(import.meta, add => {
  add(<KMPlotWithControls filter={km_data.filter} />).wrap(backend.mock(km_data.request))

  add(
    <KMPlotWithControlsView
      plot_data={km_data.make_points(2)}
      live_rows={km_data.make_points(2).filter((_, i) => i % 7 == 0)}
      cu_data={cucount(km_data.expression, [26])}
      statistics={km_data.survival}
      cutoffs={[26]}
      set_cutoffs={() => 0}
      location_node={'location: stroma'}
      num_groups_node={'groups: 2'}
      loading={false}
    />
  )
})
