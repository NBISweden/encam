import * as React from 'react'

import {css, div} from './css'

import * as utils from './utils'

import { FormControlLabel, CssBaseline, Box, Container, Grid, Checkbox, TextField, Tooltip, Button } from '@material-ui/core'
import { Autocomplete } from '@material-ui/lab'

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

type State =
  Record<string, string[]> &
  {
    tumors: string[],
    cells: string[],
  }

function calculate_state0(conf: Conf) {
  const state0 = {} as State
  conf.variant_values.forEach(v => {
    state0[v.column] = v.values
  })
  conf.tumor_specific_values.forEach(v => {
    state0[v.column + ',' + v.tumor] = v.values
  })
  state0.cells = conf.cell_types
  state0.cells = []
  state0.tumors = ['COAD']
  return state0
}


const tumor_codes = conf.variant_values
  .filter(v => v.column == 'Tumor_type_code')[0].values
  // .map(code => ({code, long: codes[code] || ''}))

import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

function memo(deps: any[], elem: () => React.ReactElement): React.ReactElement {
  return React.useMemo(elem, deps)
}

export function Form(props: {onSubmit: (form_value: Record<string, any>) => void}) {
  const [state, set_state] = React.useState(() => calculate_state0(conf))
  const {tumors, cells} = state
  const update_state =
    (next: Partial<State> | ((s: State) => Partial<State>)) =>
    set_state(now => ({...now, ...typeof next === 'function' ? next(now) : next}) as any)
  const specific = conf.tumor_specific_values
    .map(t => memo(
      [state[t.column + ',' + t.tumor], cells.length || tumors.includes(t.tumor)],
      () => <Autocomplete
        key={t.column + t.tumor}
        multiple
        style={{
          display: (cells.length || tumors.includes(t.tumor))
            ? undefined
            : 'none'
        }}
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
        onChange={(_, selected) => update_state({[t.column + ',' + t.tumor]: selected})}
        value={state[t.column + ',' + t.tumor] || t.values}
      />))
  const misc_filters = conf.variant_values
    .filter(v => v.column != 'Tumor_type_code')
    .map(v => memo([state[v.column]], () =>
      <Grid container spacing={3}
        key={v.column}
      >
        <Grid item xs={3} style={{marginTop: 10, fontWeight: 500}}>
          <span>{v.column.replace(/(_|yesno)/g, ' ')}:</span>
        </Grid>
        <Grid item xs={9}>
          {v.values.map(value =>
            <FormControlLabel
              label={value}
              key={value}
              control={
                <Checkbox
                  checked={(state[v.column] || v.values).includes(value)}
                  size="small"
                  color="primary"
                  onChange={(_, checked) => update_state(state => {
                    const prev: string[] = state[v.column] || v.values
                    const selected = prev.slice().filter(x => x != value || checked).concat(checked ? [value] : [])
                    return {[v.column]: selected.length ? selected : v.values.filter(x => !prev.includes(x))}
                  })}
                />}
              />
          )}
        </Grid>
      </Grid>))
  return <Box>
    <CssBaseline/>
    {div(
      css`
        & { display: flex; flex-direction: column }
        & > .MuiAutocomplete-root { padding-bottom: 1em }
      `,
      memo([tumors, cells], () =>
        <Autocomplete
          key="tumor"
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
            update_state({
              tumors: selected.reverse().slice(0, 3).reverse(),
              cells: []
            })
          }}
          value={tumors}
        />),
      memo([cells, tumors], () => <Autocomplete
        key="cell"
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
          update_state({
            cells: selected.reverse().slice(0, 3).reverse(),
            tumors: [],
          })
        }}
        value={cells}
      />),
      specific,
      misc_filters,
      div(
        css`
          & { margin-left: auto }
          & > button {
            margin: 8px
          }
        `,
        <Button onClick={() => set_state(calculate_state0(conf))} variant="contained">Reset</Button>,
        <Button onClick={() => props.onSubmit && props.onSubmit(utils.expand(state))} variant="contained" color="primary">Submit</Button>
      )
    )}
  </Box>
}
