import * as React from 'react'

import {div, css} from './css'

import * as vp from './vegaplots'

import * as utils from './utils'

interface Row {
  cell: string
  tumor: string
  location: string
  expression: number
}

import { Checkbox, FormControlLabel, FormControl, FormLabel, RadioGroup, Radio } from '@material-ui/core'
import { Autocomplete } from '@material-ui/lab'

function useCheckbox(label: string, init?: boolean): [boolean, React.ReactElement] {
  const [value, set_value] = React.useState(init === undefined ? true : init)
  return [
    value,
    <FormControlLabel
      label={label}
      key={label}
      checked={value}
      onChange={(_, checked) => set_value(checked)}
      control={<Checkbox size="small" color="primary"/>}
    />
  ]
}

function useRadio<K extends string>(label: string, options: K[], init?: K): [K, React.ReactElement] {
  const [value, set_value] = React.useState(init === undefined ? options[0] : init)
  return [
    value,
    <FormControl component="fieldset">
      <FormLabel component="legend">{label}</FormLabel>
      <RadioGroup value={value} onChange={(_, value) => set_value(value as K)}>
        {options.map(option =>
          <FormControlLabel
            label={option}
            value={option}
            key={option}
            control={<Radio size="small" color="primary"/>}
          />
        )}
      </RadioGroup>
    </FormControl>
  ]
}

type Options = Partial<vp.Options<keyof Row>>

export function Boxplot(props: {data: Row[], facet?: 'cell' | 'tumor'}) {
  const [split, split_checkbox] = useCheckbox('split tumor and stroma', false)
  const [mean, mean_checkbox] = useCheckbox('show mean', false)
  const [radio_facet, facet_radio] = useRadio('facet', ['cell', 'tumor'])
  const facet = props.facet ?? radio_facet
  const [orientation, orientation_radio] = useRadio('orientation', ['landscape', 'portrait'])
  const radicals = ['√', '∛', '∜']
  const [scale, scale_radio] = useRadio('scale', ['linear', ...radicals], radicals[0])
  const [mode, mode_radio] = useRadio('box plot settings', ['default (1.5*IQR)', 'min-max'])
  const opposite = (x: keyof Row) => x === 'cell' ? 'tumor' : 'cell'
  const options: Partial<Options> =
    split
      ? {
        inner: opposite(facet),
        facet: facet,
        split: 'location',
        color: opposite(facet),
      }
      : {
        inner: [opposite(facet), 'location'],
        facet: facet,
        color: opposite(facet),
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
  utils.useWhyChanged('boxplots.Boxplot', {...props, split, radio_facet, orientation, scale, mode})
  return div(
    <vp.PrecalcBoxplot data={props.data} options={options}/>,
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
      split_checkbox,
      orientation_radio,
      !props.facet && facet_radio,
      scale_radio,
      mode_radio,
      mean_checkbox,
    )
  )
}
