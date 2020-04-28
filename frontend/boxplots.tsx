import * as React from 'react'

import {div, css} from './css'

import * as vp from './vegaplots'

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

export function Boxplot(props: {data: Row[], facet0?: 'cell' | 'tumor'}) {
  const [split, split_checkbox] = useCheckbox('split', false)
  const [facet, facet_radio] = useRadio('facet', ['cell', 'tumor'], props.facet0)
  const [orientation, orientation_radio] = useRadio('orientation', ['landscape', 'portrait'])
  const radicals = ['√', '∛', '∜']
  const [scale, scale_radio] = useRadio('scale', ['linear', ...radicals, 'semilog'])
  const opposite = (x: keyof Row) => x === 'cell' ? 'tumor' : 'cell'
  const options: Partial<vp.Options<keyof Row>> =
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
  const r = radicals.indexOf(scale)
  if (r != -1) {
    options.scale = {
      type: 'pow',
      exponent: 1 / (2 + r)
    }
  }
  console.log({options})
  return div(
    <vp.Boxplot data={props.data} options={options}/>,
    div(
      split_checkbox,
      orientation_radio,
      facet_radio,
      scale_radio,
    )
  )
}
