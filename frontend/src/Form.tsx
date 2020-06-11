import * as React from 'react'
import * as ReactDOM from 'react-dom'

import {css, div} from './css'

import * as utils from './utils'

import * as ui from './ui_utils'

import { FormControlLabel, CssBaseline, Box, Grid, Checkbox, TextField, Button } from '@material-ui/core'
import { Autocomplete } from '@material-ui/lab'

export interface Conf {
  variant_values: {
    column: string,
    values: string[],
  }[],
  tumor_specific_values: {
    column: string,
    tumor: string,
    values: string[],
  }[],
  cells: string[],
  tumors: string[],
  tumor_codes: Record<string, string>,
}

type State =
  Record<string, string[]> &
  {
    tumors: string[],
    cells: string[],
  }

function calculate_state0(conf: Conf, key_prefix: string) {
  const state0 = {} as State
  conf.variant_values.forEach(v => {
    state0[v.column] = v.values
  })
  conf.tumor_specific_values.forEach(v => {
    state0[v.column + ',' + v.tumor] = v.values
  })
  state0.cells = conf.cells
  state0.cells = []
  state0.tumors = ['BRCA']
  if (key_prefix == 'A') {
    state0.pN_stage = state0.pN_stage.slice(0, 1)
  } else if (key_prefix == 'B') {
    state0.pN_stage = state0.pN_stage.slice(1, 2)
  }
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

export interface FormProps {
  conf: Conf
  onSubmit?: (...form_values: Record<string, any>[]) => void
  onState?: (...form_values: Record<string, any>[]) => void
}

function prepare_state_for_backend(state0: State, conf: Conf) {
  const state = {...state0}
  let facet
  if (state0.cells.length == 0) {
    state.cells = conf.cells
    facet = 'cell'
  }
  if (state0.tumors.length == 0) {
    state.tumors = conf.tumors
    facet = 'tumor'
  }
  return {
    ...utils.expand(state),
    facet,
  }
}

export function Form({conf, onSubmit, onState}: FormProps) {
  const {state, reset, form} = useForm(conf)

  // React.useEffect(() => onSubmit(prepare_state_for_backend(state, conf)), [])

  const get_form_values = () => [prepare_state_for_backend(state, conf)]

  onState && onState(...get_form_values())

  // ui.useRecord()

  ui.useWhyChanged('Form', {conf, state})

  const buttons = div(
    css`
      & { margin-left: auto }
      & > button {
        margin: 8px
      }
    `,
    <Button variant="contained" onClick={() => reset()}>Reset</Button>,
    <Button variant="contained" color="primary" startIcon={<BarChartIcon/>}
      onClick={() => onSubmit && onSubmit(...get_form_values())}>Plot</Button>
  )


  return <Box>
    <CssBaseline/>
    {div(
      css`
        & { display: flex; flex-direction: column }
        & > .MuiAutocomplete-root { padding-bottom: 1em }
      `,
      ...form,
      buttons
    )}
  </Box>
}

export function TwoForms({conf, onSubmit, onState}: FormProps) {
  const A = useForm(conf, 'A')
  const B = useForm(conf, 'B')

  const forms = [A, B]

  const get_form_values = () => forms.map(form => prepare_state_for_backend(form.state, conf))

  const on_submit = () => onSubmit && onSubmit(...get_form_values())

  onState && onState(...get_form_values())

  const reset = () => ReactDOM.unstable_batchedUpdates(() => forms.forEach(form => form.reset()))

  // React.useEffect(() => on_submit(), [])

  const [do_stitch, box_stitch] = ui.useCheckbox('stitch', false)

  ui.useWhyChanged('Form', {conf, A_state: A.state, B_state: B.state, do_stitch})

  const buttons = div(
    css`
      & { margin-left: auto }
      & > button {
        margin: 8px
      }
    `,
    box_stitch,
    <Button variant="contained" onClick={() => reset()}>Reset</Button>,
    <Button variant="contained" color="primary" startIcon={<BarChartIcon/>} onClick={on_submit}>Plot</Button>
  )

  const names = "AB"

  function stitch<A>(xs: A[][]): A[] {
    const [y, ...ys] = xs
    return y.flatMap((a, i) => [a, ...ys.map(y => y[i])])
  }

  return <Box>
    <CssBaseline/>
    {div(
      css`
        & { display: flex; flex-direction: column }
        & > .MuiAutocomplete-root { padding-bottom: 1em }
      `,
      do_stitch
        ? stitch(forms.map(form => form.form))
        : forms.map((form, i) => [
            <h2>Group {names[i]}</h2>,
            form.form,
          ]),
      buttons
    )}
  </Box>
}

function useForm(conf: Conf, key_prefix='') {

  const state0 = () => calculate_state0(conf, key_prefix)
  const [state, set_state] = React.useState(state0)
  const {tumors, cells} = state
  const update_state =
    (next: Partial<State> | ((s: State) => Partial<State>)) =>
    set_state(now => ({...now, ...typeof next === 'function' ? next(now) : next}) as any)

  const specific = conf.tumor_specific_values
    .map(t => memo(
      [state[t.column + ',' + t.tumor], cells.length || tumors.includes(t.tumor)],
      () => cells.length || tumors.includes(t.tumor)
        ? <Autocomplete
          key={key_prefix + ':' + t.column + t.tumor}
          multiple
          options={t.values}
          disableCloseOnSelect
          renderOption={(option, {selected}) =>
            <label>
              <Checkbox
                icon={icon}
                checkedIcon={checkedIcon}
                style={{ marginRight: 8, padding: 0 }}
                checked={selected}
                color="primary"
              />
              {utils.pretty(option)}
            </label>
          }
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
        />
        : <React.Fragment/>))

  const misc_filters = conf.variant_values
    .map(v => memo([state[v.column]], () =>
      <Grid container spacing={3}
        key={key_prefix + ':' + v.column}
      >
        <Grid item xs={3} style={{marginTop: 10, fontWeight: 500}}>
          <span>{v.column.replace(/(_|yesno)/g, ' ').trim()}:</span>
        </Grid>
        <Grid item xs={9}>
          {v.values.map(value =>
            <FormControlLabel
              label={value}
              key={key_prefix + ':' + value}
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

  const tumor_type = memo([tumors, cells], () =>
    <Autocomplete
      key={key_prefix + ':tumor'}
      multiple
      options={conf.tumors}
      disableCloseOnSelect
      renderOption={(option, {selected}) =>
        <>
          <label>
            <Checkbox
              icon={icon}
              checkedIcon={checkedIcon}
              style={{ marginRight: 8, padding: 0 }}
              checked={selected}
              color="primary"
            />
            {option}
          </label>
          <i style={{paddingLeft: 8, whiteSpace: 'nowrap', fontSize: '0.8em'}}>({conf.tumor_codes[option]})</i>
        </>}
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
   />)

  const cell_type = memo([cells, tumors], () =>
    <Autocomplete
      key={key_prefix + ':cell'}
      multiple
      options={conf.cells}
      disableCloseOnSelect
      renderOption={(option, {selected}) =>
        <label>
          <Checkbox
            icon={icon}
            checkedIcon={checkedIcon}
            style={{ marginRight: 8, padding: 0 }}
            checked={selected}
            color="primary"
          />
          {utils.pretty(option)}
        </label>}
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
    />)

  return {
    state,
    reset: () => set_state(state0()),
    form: [
      tumor_type,
      cell_type,
      ...specific,
      ...misc_filters,
    ]
  }
}
