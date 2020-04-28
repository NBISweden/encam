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
  state0.tumors = ['COAD', 'BRCA']
  delete state0.Tumor_type_code
  return state0
}


import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank'
import CheckBoxIcon from '@material-ui/icons/CheckBox'
import BarChartIcon from '@material-ui/icons/BarChart'

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />
const checkedIcon = <CheckBoxIcon fontSize="small" />

function memo(deps: any[], elem: () => React.ReactElement): React.ReactElement {
  return React.useMemo(elem, deps)
}

import * as backend from './backend'

interface OnSubmit {
  onSubmit(form_value: Record<string, any>): void
}

export function FormLoadConf(props: OnSubmit) {
  const conf = backend.useRequest('configuration')
  return <Form conf={conf} {...props}/>
}

function prepare_state_for_backend(state0: State, conf: Conf) {
  const conf_tumors = conf.variant_values
    .filter(v => v.column == 'Tumor_type_code')[0].values
  const state = {...state0}
  let facet
  if (!state.cells.length) {
    state.cells = conf.cell_types
    facet = 'cell'
  }
  if (!state.tumors.length) {
    state.tumors = conf_tumors
    facet = 'tumor'
  }
  return {
    ...utils.expand(state),
    facet,
  }
}

export function Form({conf, onSubmit}: {conf: Conf} & OnSubmit) {
  const tumor_codes = conf.variant_values
    .filter(v => v.column == 'Tumor_type_code')[0].values

  const [state, set_state] = React.useState(() => calculate_state0(conf))
  const {tumors, cells} = state
  const update_state =
    (next: Partial<State> | ((s: State) => Partial<State>)) =>
    set_state(now => ({...now, ...typeof next === 'function' ? next(now) : next}) as any)


  const buttons = div(
    css`
      & { margin-left: auto }
      & > button {
        margin: 8px
      }
    `,
    <Button variant="contained" onClick={() => set_state(calculate_state0(conf))}>Reset</Button>,
    <Button variant="contained" color="primary" startIcon={<BarChartIcon/>}
      onClick={() => onSubmit && onSubmit(prepare_state_for_backend(state, conf))}>Plot</Button>
  )

  const codes = backend.useRequest('codes') || {} as Record<string, string>
  // React.useEffect(() => onSubmit(prepare_state_for_backend(state, conf)), [])

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
        renderOption={(option, { selected } ) =>
          <React.Fragment>
            <Checkbox
              icon={icon}
              checkedIcon={checkedIcon}
              style={{ marginRight: 8, padding: 0 }}
              checked={selected}
              color="primary"
            />
            {option}
          </React.Fragment>}
        renderInput={(params) => {
          const error = state[t.column + ',' + t.tumor].length == 0
          return (
            <TextField {...params}
              variant="outlined"
              label={t.column + ' ' + t.tumor}
              error={error}
              helperText={error && "Need at least one option"}
            />
        )}}
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
              style={{minWidth: '5em'}}
              checked={(state[v.column] || v.values).includes(value)}
              onChange={(_, checked) => update_state(state => {
                const prev: string[] = state[v.column] || v.values
                const selected = prev.slice().filter(x => x != value || checked).concat(checked ? [value] : [])
                return {[v.column]: selected.length ? selected : v.values.filter(x => !prev.includes(x))}
              })}
              control={<Checkbox size="small" color="primary"/>}
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
      memo([tumors, cells, codes], () =>
        <Autocomplete
          key="tumor"
          multiple
          options={tumor_codes}
          disableCloseOnSelect
          renderOption={(option, { selected } ) =>
            <React.Fragment>
              <Checkbox
                icon={icon}
                checkedIcon={checkedIcon}
                style={{ marginRight: 8, padding: 0 }}
                checked={selected}
                color="primary"
              />
              {option} <i style={{paddingLeft: 8, whiteSpace: 'nowrap', fontSize: '0.8em'}}>({codes[option]})</i>
            </React.Fragment>}
          fullWidth={true}
          renderInput={(params) => (
            <TextField {...params}
              variant="outlined"
              label={'Tumor types' + (cells.length ? ' (cells selected, comparing across all tumors)' : '')}
            />
          )}
          onChange={(_, selected) => {
            update_state({
              tumors: utils.last(3, selected),
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
        renderOption={(option, { selected } ) =>
          <React.Fragment>
            <Checkbox
              icon={icon}
              checkedIcon={checkedIcon}
              style={{ marginRight: 8, padding: 0 }}
              checked={selected}
              color="primary"
            />
            {option}
          </React.Fragment>}
        fullWidth={true}
        renderInput={(params) => (
          <TextField {...params}
            variant="outlined"
            label={'Cell types' + (tumors.length ? ' (tumors selected, comparing across all cells)' : '')}
          />
        )}
        onChange={(_, selected) => {
          update_state({
            cells: utils.last(3, selected),
            tumors: [],
          })
        }}
        value={cells}
      />),
      specific,
      misc_filters,
      buttons
    )}
  </Box>
}

