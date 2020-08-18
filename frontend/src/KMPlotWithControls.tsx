import * as ReactDOM from 'react-dom'
import * as React from 'react'
import * as backend from './backend'

import * as ui from './ui_utils'
import * as utils from './utils'

import {VegaKMPlot} from './VegaKMPlot'
import {VegaCumulativeCount, cucount, slider_max, bin_sizes} from './VegaCumulativeCount'

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

export function KMPlotWithControls({filter}: {filter: Record<string, any>}) {
  const [location, location_node] = ui.useRadio('Location', ['Tumor', 'Stroma'])
  const [num_groups_str, num_groups_node] = ui.useRadio('Groups', ['2', '3', '4'])
  const num_groups = Number(num_groups_str)

  const [plot_data, set_plot_data] = React.useState(undefined as any)
  const [expr_data, set_expr_data] = React.useState(undefined as undefined | number[])
  const [loading, set_loading] = React.useState(false)

  const request = backend.useRequestFn()

  const [cutoffs, set_cutoffs] = React.useState([] as number[])

  ui.useAsync(async () => {
    // Get the expression levels when filter or location changes
    const filter_full = {
      ...filter,
      cell_full: filter.cell + '_' + location.toUpperCase(),
    }
    console.time('expression')
    set_loading(true)
    const next_expr_data = [...(await request('expression', filter_full))]
    console.timeEnd('expression')
    ReactDOM.unstable_batchedUpdates(() => {
      set_expr_data(next_expr_data)
      if (!next_expr_data.length) {
        set_plot_data(undefined)
      }
      if (!expr_data || expr_data.length !== next_expr_data.length) {
        set_cutoffs([])
      }
    })
  }, [filter, location])

  const cu_data = React.useMemo(() => {
    if (expr_data) {
      return cucount(expr_data, cutoffs)
    } else {
      return undefined
    }
  }, [expr_data, cutoffs])

  React.useLayoutEffect(() => {
    // update cutoffs if num_groups or the data was changed
    if (cu_data && cu_data.length) {
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
          set_cutoffs(next_cutoffs)
        }
      }
    }
  }, [cu_data, num_groups])

  const [fired, set_fired] = React.useState(false)
  if (false) {
    // testing
    React.useEffect(() => {
      if (cu_data && cu_data.length && !fired) {
        set_fired(true)
        setTimeout(() => {
          console.log('fire₁!')
          fireEvent.click(screen.getByLabelText('Stroma'))
          // fireEvent.keyDown(screen.getByRole('slider'), {key: 'ArrowRight', code: 'ArrowRight'})
        }, 200)
        setTimeout(() => {
          console.log('fire₂!')
          fireEvent.click(screen.getByLabelText('Tumor'))
          // fireEvent.keyDown(screen.getByRole('slider'), {key: 'ArrowRight', code: 'ArrowRight'})
        }, 800)
      }
    }, [cu_data])
  }

  React.useLayoutEffect(() => {
    // when we slide around the cutoffs there will be a request scheduled by the debounce
    if (cu_data) {
      if (cu_data.length) {
        set_loading(true)
      } else {
        // unless there was no data
        set_loading(false)
      }
    }
  }, [cu_data])

  ui.useDebounce(
    400,
    React.useCallback(async () => {
      // after a little while of no changes to the slider request new survival calculation
      if (cu_data && cu_data.length) {
        const group_sizes = bin_sizes(cu_data)
        const filter_full = {
          ...filter,
          cell_full: filter.cell + '_' + location.toUpperCase(),
          group_sizes,
          num_groups: group_sizes.length,
        }
        console.time('survival')
        const next_plot_data = await (async () => {
          try {
            const res = await request('survival', {
              ...filter_full,
              group_sizes,
            })
            return res.points
          } catch (e) {
            console.error(e)
            return undefined
          }
        })()
        console.timeEnd('survival')
        ReactDOM.unstable_batchedUpdates(() => {
          set_loading(false)
          set_plot_data(next_plot_data)
        })
      }
    }, [cu_data])
  )

  const [options, opt_nodes] = ui.record({
    ci: ui.useCheckbox('show confidence intervals (95%)', true),
  })

  ui.useWhyChanged(KMPlotWithControls, {
    filter,
    plot_data,
    loading,
    location,
    num_groups,
    cutoffs,
    cu_data,
    options,
  })

  const classes = useStyles()
  const plot =
    cu_data && cu_data.length == 0 ? (
      <>No records with the given filter.</>
    ) : (
      <div className={classes.KMPlotWithControls}>
        <div style={{marginLeft: 30, ...ui.flex_column}}>
          {location_node}
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
              {num_groups_node}
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
