import * as React from 'react'

import {div, css} from './css'

import * as VB from './VegaBoxplot'

import * as utils from './utils'

import * as ui from './ui_utils'

import {FormControl, FormLabel, FormGroup} from '@material-ui/core'

export interface Row {
  cell: string
  tumor: string
  location: string
  group: string
}

type Options = Partial<VB.Options<keyof Row>>

import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import ExpandLessIcon from '@material-ui/icons/ExpandLess'

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

  const [options, options_form] = useOptions(props.facet)
  const facet = props.facet

  const facet_vals = utils.uniq(props.data.map(x => x[facet]))
  const all_facets = Object.fromEntries(facet_vals.map(v => [v, true]))
  const [visible_facets, facet_boxes, set_visible_facets] = ui.useCheckboxes(facet_vals, all_facets)
  React.useEffect(() => {
    set_visible_facets(all_facets)
  }, [JSON.stringify(facet_vals)])
  const [show, set_show] = React.useState(true)
  const icon_style = {marginLeft: -8, transform: 'translateY(7px)'}

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

  return div(
    css`
      flex-direction: row;
      display: flex;
    `,
    div(
      css`
        flex-direction: column;
        display: flex;
        margin-left: 2px;
        margin-right: 7px;
        // & * {
        //   font-size: 16px !important;
        // }
        & .MuiButtonBase-root {
          padding: 4px;
          padding-left: 9px;
        }
      `,
      <FormControl>
        <FormLabel
          style={{whiteSpace: 'pre', cursor: 'pointer', marginBottom: 2}}
          onClick={() => set_show(b => !b)}>{
            show
              ? <> <ExpandLessIcon style={icon_style}/>{`visible ${facet}s`}</>
              : <ExpandMoreIcon style={icon_style}/>
        }</FormLabel>
        { show && <FormGroup>
          {facet_boxes}
        </FormGroup> }
      </FormControl>
    ),
    div(
      div(
        css`
          & .MuiFormGroup-root {
            flex-direction: row;
          }
          & {
            display: flex;
            flex-direction: column;
          }
        `,
        plot,
        options_form,
      )
    ),
  )
}

