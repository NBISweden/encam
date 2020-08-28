import * as React from 'react'

import {Boxplot, Options as BoxplotOptions, Precalc} from './Vega/Boxplot'

import * as utils from './utils'

import * as ui from './ui_utils'

import {FormControl, FormLabel, FormGroup} from '@material-ui/core'

import {makeStyles} from '@material-ui/core/styles'

import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import ExpandLessIcon from '@material-ui/icons/ExpandLess'

export interface Row {
  cell: string
  tumor: string
  location: string
  group: string
}

type Options = Partial<BoxplotOptions<keyof Row>>

const useStyles = makeStyles({
  BoxPlotWithControls: {
    ...ui.flex_row,
  },
  VisibleSidebar: {
    ...ui.flex_column,
    marginLeft: 2,
    marginRight: 7,

    // Checkboxes:
    '& .MuiFormControlLabel-root': {
      whiteSpace: 'pre',
      cursor: 'pointer',
      marginBottom: 2,
    },
    '& .MuiCheckbox-root': {
      padding: 4,
      paddingLeft: 9,
    },
  },
  VisibleSidebarIcon: {
    marginLeft: -8,
    transform: 'translateY(7px)',
  },
  Main: {
    ...ui.flex_column,

    // Radio buttons:
    '& .MuiFormGroup-root': {
      ...ui.flex_row,
    },
  },
})

function useOptions(facet: keyof Row) {
  const radicals = ['√', '∛', '∜']

  const [opts, nodes] = ui.record({
    split: ui.useCheckbox('split tumor and stroma', false),
    mean: ui.useCheckbox('show mean', false),
    scale: ui.useRadio('scale', ['linear', ...radicals], radicals[0]),
    mode: ui.useRadio('box plot settings', ['default (1.5*IQR)', 'min-max']),
    orientation: ui.useRadio('orientation', ['landscape', 'portrait'], 'portrait'),
  })

  const opposite = (x: keyof Row) => (x === 'cell' ? 'tumor' : 'cell')
  const options: Partial<Options> = opts.split
    ? {
        inner: [opposite(facet), 'group'],
        facet: facet,
        split: 'location',
        color: [opposite(facet), 'group'],
      }
    : {
        inner: [opposite(facet), 'location', 'group'],
        facet: facet,
        color: [opposite(facet), 'group'],
      }
  options.stripes = 'location'
  options.landscape = opts.orientation == 'landscape'
  options.scale = {
    type: opts.scale === 'linear' ? 'linear' : 'semilog',
  }
  options.mode = opts.mode === 'min-max' ? 'min-max' : 'default'
  options.show_mean = opts.mean
  const r = radicals.indexOf(opts.scale)
  if (r != -1) {
    options.scale = {
      type: 'pow',
      exponent: 1 / (2 + r),
    }
  }
  return [ui.useIntern(options), nodes] as const
}

function useVisibleSidebar(facet: string, facet_values: string[]) {
  const all_selected = Object.fromEntries(facet_values.map(v => [v, true]))

  const [visible_facets, facet_boxes] = ui.useCheckboxes(facet_values, all_selected, utils.pretty)

  const [show, set_show] = React.useState(true)

  const classes = useStyles()
  return [
    visible_facets,
    <div className={classes.VisibleSidebar}>
      <FormControl>
        <FormLabel onClick={() => set_show(b => !b)}>
          {show ? (
            <>
              {' '}
              <ExpandLessIcon className={classes.VisibleSidebarIcon} />
              {`visible ${facet}s`}{' '}
            </>
          ) : (
            <ExpandMoreIcon className={classes.VisibleSidebarIcon} />
          )}
        </FormLabel>
        <FormGroup>{show && facet_boxes}</FormGroup>
      </FormControl>
    </div>,
  ] as const
}

export function BoxplotWithControls({
  data,
  facet,
}: {
  data: (Row & Precalc)[]
  facet: 'cell' | 'tumor'
}) {
  const [options, Options] = useOptions(facet)

  const facet_values = utils.uniq(data.map(x => x[facet]))

  const [visible_facets, VisibleSidebar] = useVisibleSidebar(facet, facet_values)

  const plot_data = React.useMemo(() => data.filter(x => visible_facets[x[facet]]), [
    data,
    utils.str(visible_facets),
  ])

  const plot_options = React.useMemo(() => ({...options, trimmable: {group: true}}), [
    utils.str(options),
  ])

  ui.useWhyChanged(BoxplotWithControls, {
    data,
    facet,
    ...options,
    visible_facets,
    plot_data,
    plot_options,
  })

  const classes = useStyles()
  return (
    <div className={classes.BoxPlotWithControls}>
      {VisibleSidebar}
      <div className={classes.Main}>
        <Boxplot data={plot_data} options={plot_options} />
        {Options}
      </div>
    </div>
  )
}
