import * as React from 'react'

import {Boxplot, Options as BoxplotOptions, Precalc} from './Vega/Boxplot'

import * as utils from './utils'
import * as adhoc from './adhoc'

import * as ui from './ui_utils'

import {FormLabel} from '@material-ui/core'

import {useCheckboxRow} from './CheckboxRow'

import {css} from 'emotion'

import ExpandMore from '@material-ui/icons/ExpandMore'
import ChevronRight from '@material-ui/icons/ChevronRight'

export interface Row {
  cell: string
  tumor: string
  location: string
  group: string
}

type Options = Partial<BoxplotOptions<keyof Row>>

const classes = {
  BoxPlotWithControls: css({
    ...ui.flex_column,
    // Radio buttons:
    '& .MuiFormGroup-root': {
      ...ui.flex_row,
    },
    '& .Embed': {
      overflowX: 'scroll',
    },
  }),
  VisibleSidebar: css({
    ...ui.flex_column,
    marginTop: -4,
    marginBottom: 12,
    '& .visible-label': {
      fontSize: '0.85rem',
      paddingBottom: 3,
      paddingRight: 10,
      marginRight: 'auto',
      cursor: 'pointer',
    },
    '&:focus-within .visible-label span, & .visible-label:hover span': {
      color: '#4669a4',
    },
    '& .visible-icon': {
      marginRight: 2,
      transform: 'translateY(5px)',
    },
    '& .visible-checkboxes': {
      ...ui.flex_row,
      flexWrap: 'wrap',
      marginLeft: 4,
      '--checkbox-bg': '#e0e0e0',
      '--checkbox-fg': '#333',
    },
  }),
}

function useOptions(facet: keyof Row) {
  const radicals = ['√', '∛', '∜']

  const opts = {
    split: ui.useCheckbox('split tumor and stroma', false),
    mean: ui.useCheckbox('show mean', false),
    scale: ui.useRadio('scale', ['linear', ...radicals], radicals[0]),
    mode: ui.useRadio('box plot settings', ['default (1.5*IQR)', 'min-max']),
    orientation: ui.useRadio('orientation', ['landscape', 'portrait'], 'portrait'),
  }

  const {value, node} = ui.merge(opts)

  const opposite = (x: keyof Row) => (x === 'cell' ? 'tumor' : 'cell')
  const options: Partial<Options> = value.split
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
  options.landscape = value.orientation == 'landscape'
  options.scale = {
    type: value.scale === 'linear' ? 'linear' : 'semilog',
  }
  options.mode = value.mode === 'min-max' ? 'min-max' : 'default'
  options.show_mean = value.mean
  const r = radicals.indexOf(value.scale)
  if (r != -1) {
    options.scale = {
      type: 'pow',
      exponent: 1 / (2 + r),
    }
  }
  return {value: ui.useIntern(options), node}
}

function useVisibleSidebar(facet: string, facet_values_unsorted: string[]) {
  const facet_values = React.useMemo(
    () =>
      facet.match(/cell/)
        ? adhoc.sort_cells(facet_values_unsorted)
        : adhoc.sort_tumors(facet_values_unsorted),
    [facet, facet_values_unsorted]
  )

  const facet_boxes = useCheckboxRow({
    options: facet_values,
    labelBy: adhoc.pretty,
  })

  const value = utils.createObject(
    facet_boxes.value,
    k => k,
    () => true
  )

  const [show, set_show] = React.useState(true)

  const [delayed_value, enqueue_delayed_value] = ui.useDelayed(400, value)

  const loading = !utils.equal(value, delayed_value)

  React.useEffect(() => {
    // Need to delay because making the vega plot takes some 100s of millis
    // which makes the UI stutter. This stutter makes the user have to wait for
    // an immediate repaint with an unresponsive UI. With the delay the user
    // has a chance to deselect many cells in one go.
    enqueue_delayed_value(value)
  }, [utils.str(value)])

  return {
    visible_facets: delayed_value,
    loading,
    node: (
      <div className={classes.VisibleSidebar}>
        <FormLabel className="visible-label" onClick={() => set_show(b => !b)}>
          {show ? (
            <ExpandMore className="visible-icon" fontSize="small" />
          ) : (
            <ChevronRight className="visible-icon" fontSize="small" />
          )}
          <span>{`visible ${facet}s`}</span>
        </FormLabel>
        <div className="visible-checkboxes small-checkbox-row">{show && facet_boxes.node}</div>
      </div>
    ),
  }
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
  const options = useOptions(facet)

  const facet_values = utils.uniq(data.map(x => x[facet]))

  const {visible_facets, loading, ...visible_sidebar} = useVisibleSidebar(facet, facet_values)

  React.useLayoutEffect(() => {
    set_loading && set_loading(loading)
  }, [loading])

  const plot_data = ui.useIntern(data.filter(x => visible_facets[x[facet]]))

  const plot_options = ui.useIntern({...options.value, trimmable: {group: true}})

  ui.useWhyChanged(BoxplotWithControls, {
    data,
    facet,
    ...options.value,
    visible_facets,
    loading,
    plot_data,
    plot_options,
  })

  return (
    <div className={classes.BoxPlotWithControls}>
      {visible_sidebar.node}
      <Boxplot data={plot_data} options={plot_options} />
      {options.node}
    </div>
  )
}

import {stories} from './ui_utils/stories'
import {rows} from './data/boxplot'

stories(add => {
  add({
    cell: <BoxplotWithControls data={rows} facet="cell" />,
    tumor: <BoxplotWithControls data={rows} facet="tumor" />,
  })
})
