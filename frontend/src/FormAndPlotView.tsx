import * as React from 'react'

import * as ui from './ui_utils'
import * as utils from './utils'

import {CircularProgress} from '@material-ui/core'

import {css} from 'emotion'

const classes = {
  FormAndPlotView: css({
    ...ui.flex_row,
    alignItems: 'flex-start',
    '& > :not(:first-child)': {
      flexGrow: 1,
      flexShrink: 1,
      marginLeft: 0,
    },
  }),
  Reloading: css({
    position: 'relative',
    '& > *': {
      position: 'absolute',
      right: 0,
      top: 0,
      background: '#fffd',
      boxShadow: '0 0 8px 8px #fffe',
    },
  }),
}

export function Loading({reloading = false}) {
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
      <ui.Paper
        key="plot"
        style={
          {
            // width: 'fit-content'
          }
        }>
        {loading && <Loading reloading={!!plot} />}
        {plot}
      </ui.Paper>
    )
  )
}

export function FormAndPlotView({
  form = undefined as React.ReactNode,
  plot = undefined as React.ReactNode,
}) {
  return (
    <div className={classes.FormAndPlotView}>
      <ui.Paper key="form">{form || <CircularProgress />}</ui.Paper>
      {plot}
    </div>
  )
}

import stories from '@app/ui_utils/stories'

stories(add => {
  add(
    <div>
      <FormAndPlotView />
      <FormAndPlotView form={<h2>Form</h2>} />
      <FormAndPlotView form={<h2>Form</h2>} plot={<LoadingPlot loading={true} />} />
      <FormAndPlotView
        form={<h2>Form</h2>}
        plot={<LoadingPlot plot={<h2>Example plot view</h2>} />}
      />
      <FormAndPlotView
        form={<h2>Form</h2>}
        plot={<LoadingPlot plot={<h2>Example plot view</h2>} loading={true} />}
      />
    </div>
  )
    .name('FormAndPlotView')
    .snap()
})
