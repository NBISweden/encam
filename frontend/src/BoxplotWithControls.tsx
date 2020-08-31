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
    ...ui.flex_column,
    // Radio buttons:
    '& .MuiFormGroup-root': {
      ...ui.flex_row,
    },
  },
  VisibleSidebar: {
    ...ui.flex_column,
    marginTop: -4,
    '--checkbox-bg': '#e0e0e0',
    '--checkbox-fg': '#333',
    marginBottom: 12,
    '& .visible-label': {
      fontSize: '0.85rem',
      marginBottom: 3,
    },
    '& > .visible-checkboxes': {
      ...ui.flex_row,
      flexWrap: 'wrap',
      marginLeft: 4,
    },
    '& .checkbox-label': {
      margin: '2 2',
      padding: '2 7',
      fontSize: '0.73rem',
      borderWidth: 1.5,
    },
    '& .visible-icon': {
      // marginLeft: -8,
      marginRight: 2,
      transform: 'translateY(5px)',
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
        inner: ['group', opposite(facet)],
        facet: facet,
        split: 'location',
        color: ['group', opposite(facet)],
      }
    : {
        inner: ['location', 'group', opposite(facet)],
        facet: facet,
        color: ['group', opposite(facet)],
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

import {CheckboxRow} from './Form'
import {useStore} from './ui_utils'

function useVisibleSidebar(facet: string, facet_values: string[]) {
  const [store] = useStore({visible: facet_values})

  // React.useLayoutEffect(() => {
  // store.update({visible: facet_values})
  // }, [utils.str(facet_values)])

  const [show, set_show] = React.useState(true)

  const facet_boxes = CheckboxRow(facet_values, 'visible', store, ...React.useState(false))

  const value = Object.fromEntries(store.get().visible.map(v => [v, true]))

  const [delayed_value, enqueue_delayed_value] = ui.useDelayed(400, value)

  const loading = !utils.equal(value, delayed_value)

  React.useEffect(() => {
    enqueue_delayed_value(value)
  }, [utils.str(value)])

  const classes = useStyles()
  return [
    {
      visible_facets: delayed_value,
      loading,
    },
    <div className={classes.VisibleSidebar}>
      <FormLabel className="visible-label" onClick={() => set_show(b => !b)}>
        {!show ? (
          <ExpandLessIcon className="visible-icon" fontSize="small" />
        ) : (
          <ExpandMoreIcon className="visible-icon" fontSize="small" />
        )}
        {`visible ${facet}s`}{' '}
      </FormLabel>
      <div className="visible-checkboxes">{show && facet_boxes}</div>
    </div>,
  ] as const
}

export function BoxplotWithControls({
  data,
  facet,
  set_loading,
}: {
  data: (Row & Precalc)[]
  facet: 'cell' | 'tumor'
  set_loading?: ui.Setter<boolean>
}) {
  const [options, Options] = useOptions(facet)

  const facet_values = utils.uniq(data.map(x => x[facet]))

  const [{visible_facets, loading}, VisibleSidebar] = useVisibleSidebar(facet, facet_values)

  React.useLayoutEffect(() => {
    set_loading && set_loading(loading)
  }, [loading])

  const plot_data = ui.useIntern(data.filter(x => visible_facets[x[facet]]))

  const plot_options = ui.useIntern({...options, trimmable: {group: true}})

  ui.useWhyChanged(BoxplotWithControls, {
    data,
    facet,
    ...options,
    visible_facets,
    loading,
    plot_data,
    plot_options,
  })

  const classes = useStyles()
  return (
    <div className={classes.BoxPlotWithControls}>
      {VisibleSidebar}
      <Boxplot data={plot_data} options={plot_options} />
      {Options}
    </div>
  )
}
