import * as React from 'react'

import * as ui from './ui_utils'
import * as utils from './utils'

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
