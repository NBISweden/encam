import * as React from 'react'

import * as VB from './VegaBoxplot'

import * as utils from './utils'

import {div, css} from './ui_utils'
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

type Options = Partial<VB.Options<keyof Row>>

const useStyles = makeStyles({
  BoxPlotWithControls: {
    ...ui.flex_row
  },
  VisibleSidebar: {
    ...ui.flex_column,
    marginLeft: 2,
    marginRight: 7,

    // Checkboxes:
    '& .MuiFormControlLabel-root': {
      whiteSpace: 'pre',
      cursor: 'pointer',
      marginBottom: 2
    },
    '& .MuiCheckbox-root': {
      padding: 4,
      paddingLeft: 9,
    },
  },
  VisibleSidebarIcon: {
    marginLeft: -8,
    transform: 'translateY(7px)'
  },
  Main: {
    ...ui.flex_column,

    // Radio buttons:
    '& .MuiFormGroup-root': {
      ...ui.flex_row,
    }
  },
})

function useOptions(facet: keyof Row): [Options, React.ReactElement] {
  const [split, split_checkbox] = ui.useCheckbox('split tumor and stroma', false)
  const [mean, mean_checkbox] = ui.useCheckbox('show mean', false)
  const [orientation, orientation_radio] = ui.useRadio('orientation', ['landscape', 'portrait'])
  const radicals = ['√', '∛', '∜']
  const [scale, scale_radio] = ui.useRadio('scale', ['linear', ...radicals], radicals[0])
  const [mode, mode_radio] = ui.useRadio('box plot settings', ['default (1.5*IQR)', 'min-max'])
  const opposite = (x: keyof Row) => x === 'cell' ? 'tumor' : 'cell'
  const options: Partial<Options> =
    split
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
  options.landscape = orientation == 'landscape'
  options.scale = {
    type: scale === 'linear' ? 'linear' : 'semilog'
  }
  options.mode = mode === 'min-max' ? 'min-max' : 'default'
  options.show_mean = mean
  const r = radicals.indexOf(scale)
  if (r != -1) {
    options.scale = {
      type: 'pow',
      exponent: 1 / (2 + r)
    }
  }
  return [
    React.useMemo(() => options, [JSON.stringify(options)]),
    <>
      {split_checkbox}
      {orientation_radio}
      {scale_radio}
      {mode_radio}
      {mean_checkbox}
    </>
  ]
}

export function BoxplotWithControls(props: { data: (Row & VB.Precalc)[], facet: 'cell' | 'tumor' }) {

  const classes = useStyles()

  const [options, options_form] = useOptions(props.facet)
  const facet = props.facet

  const facet_vals = utils.uniq(props.data.map(x => x[facet]))
  const all_facets = Object.fromEntries(facet_vals.map(v => [v, true]))
  const [visible_facets, facet_boxes, set_visible_facets] =
    ui.useCheckboxes(facet_vals, all_facets, )

  React.useEffect(() => {
    set_visible_facets(all_facets)
  }, [JSON.stringify(facet_vals)])
  const [show, set_show] = React.useState(true)
  const plot_data = React.useMemo(
    () => props.data.filter(x => visible_facets[x[facet]]),
    [props.data, JSON.stringify(visible_facets)]
  )

  const plot_options = React.useMemo(
    () => ({...options, trimmable: {group: true}}),
    [JSON.stringify(options)]
  )

  const plot = <VB.VegaBoxplot data={plot_data} options={plot_options}/>

  ui.useWhyChanged('BoxplotWithControls', {
    ...props, ...options, visible_facets, show, plot_data, plot_options, plot
  })

  return (
    <div className={classes.BoxPlotWithControls}>
      <div className={classes.VisibleSidebar}>
        <FormControl>
          <FormLabel onClick={() => set_show(b => !b)}>
            {
              show
                ? <> <ExpandLessIcon className={classes.VisibleSidebarIcon}/>{`visible ${facet}s`}</>
                : <ExpandMoreIcon className={classes.VisibleSidebarIcon}/>
            }
          </FormLabel>
          <FormGroup>
            {show && facet_boxes}
          </FormGroup>
        </FormControl>
      </div>
      <div className={classes.Main}>
        {plot}
        {options_form}
      </div>
    </div>
  )
}

