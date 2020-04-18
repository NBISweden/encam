import * as React from 'react'

import {css, div, clear as clear_css} from './css'

import * as utils from './utils'

import { FormControlLabel, CssBaseline, Box, Container, Grid, Checkbox, TextField, Tooltip } from '@material-ui/core'
import { Autocomplete, ToggleButton, ToggleButtonGroup } from '@material-ui/lab'

interface Conf {
  variant_values: {
    column: string,
    values: string[],
  }[],
  tumor_specific_values: {
    column: string,
    tumor: string,
    values: string[],
  }[],
  cell_types_full: string[],
  cell_types: string[]
}

declare const require: (path: string) => Conf

const conf = require('./form_configuration.json')
const codes = require('./codes.json') as Record<string, string>

const tumor_codes = conf.variant_values
  .filter(v => v.column == 'Tumor_type_code')[0].values
  // .map(code => ({code, long: codes[code] || ''}))

console.log(conf)

import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export function Form() {
  const [tumors, set_tumors] = React.useState(['COAD'] as string[])
  const [cells, set_cells] = React.useState([] as string[])
  const [specifics, set_specific] = React.useState({} as any)
  const [misc, set_misc] = React.useState({} as any)
  const update_specific = (s: any) => set_specific({...specifics, ...s})
  const update_misc = (m: any) => set_misc({...misc, ...m})
  const specific = conf.tumor_specific_values
    .filter(t => cells.length || tumors.includes(t.tumor))
    .map(t => (
      <Autocomplete
        multiple
        options={t.values}
        disableCloseOnSelect
        renderOption={(option, { selected } ) => (
          <React.Fragment>
            <Checkbox
              icon={icon}
              checkedIcon={checkedIcon}
              style={{ marginRight: 8, padding: 0 }}
              checked={selected}
              color="primary"
            />
            {option}
          </React.Fragment>
        )}
        renderInput={(params) => (
          <TextField {...params}
            variant="outlined"
            label={t.column + ' ' + t.tumor}
          />
        )}
        size="small"
        onChange={(_, selected) => update_specific({[t.column + t.tumor]: selected})}
        value={specifics[t.column + t.tumor] || t.values}
      />
  ))
  const misc_filters = conf.variant_values
    .filter(v => v.column != 'Tumor_type_code')
    .map(v => (
      <Grid container spacing={3}>
        <Grid item xs={3} style={{marginTop: 10, fontWeight: 500}}>
          <span>{v.column.replace(/(_|yesno)/g, ' ')}:</span>
        </Grid>
        <Grid item xs={9}>
          {false && <ToggleButtonGroup
            value={misc[v.column] || v.values}
            size="small"
            onChange={(_, selected) => update_misc({[v.column]: selected.length ? selected : v.values.filter(x => !misc[v.column].includes(x))})}
            >{v.values.map(value =>
              <ToggleButton
                key={value}
                value={value}
              >{value}</ToggleButton>
            )}
          </ToggleButtonGroup>}
          {v.values.map(value =>
            <FormControlLabel
              label={value}
              control={
                <Checkbox
                  checked={(misc[v.column] || v.values).includes(value)}
                  size="small"
                  color="primary"
                  onChange={(_, checked) => {
                    const prev: string[] = misc[v.column] || v.values
                    const selected = prev.slice().filter(x => x != value || checked).concat(checked ? [value] : [])
                    update_misc({[v.column]: selected.length ? selected : v.values.filter(x => !prev.includes(x))})
                  }}
                />}
              />
          )}
        </Grid>
      </Grid>
    ))
  return <Box>
    <CssBaseline/>
    {div(
      css`
        & { display: flex; flex-direction: column }
        & > .MuiAutocomplete-root { padding-bottom: 1em }
      `,
      <Autocomplete
        multiple
        options={tumor_codes}
        disableCloseOnSelect
        renderOption={(option, { selected } ) => (
          <React.Fragment>
            <Checkbox
              icon={icon}
              checkedIcon={checkedIcon}
              style={{ marginRight: 8, padding: 0 }}
              checked={selected}
              color="primary"
            />
            {option} <i style={{paddingLeft: 8, whiteSpace: 'nowrap', fontSize: '0.8em'}}>({codes[option]})</i>
          </React.Fragment>
        )}
        fullWidth={true}
        renderInput={(params) => (
          <TextField {...params}
            variant="outlined"
            label={'Tumor types' + (cells.length ? ' (cells selected, comparing across all tumors)' : '')}
          />
        )}
        onChange={(_, selected) => {
          set_tumors(selected.reverse().slice(0, 3).reverse())
          set_cells([])
        }}
        value={tumors}
      />,
      <Autocomplete
        multiple
        options={conf.cell_types}
        disableCloseOnSelect
        renderOption={(option, { selected } ) => (
          <React.Fragment>
            <Checkbox
              icon={icon}
              checkedIcon={checkedIcon}
              style={{ marginRight: 8, padding: 0 }}
              checked={selected}
              color="primary"
            />
            {option}
          </React.Fragment>
        )}
        fullWidth={true}
        renderInput={(params) => (
          <TextField {...params}
            variant="outlined"
            label={'Cell types' + (tumors.length ? ' (tumors selected, comparing across all cells)' : '')}
          />
        )}
        onChange={(_, selected) => {
          set_cells(selected.reverse().slice(0, 3).reverse())
          set_tumors([])
        }}
        value={cells}
      />,
      specific,
      misc_filters,
    )}
  </Box>
}
