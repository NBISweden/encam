import * as React from 'react'
import * as ReactDOM from 'react-dom'

import * as utils from './utils'

import * as ui from './ui_utils'
import {Store} from './ui_utils'

import {cellOrder} from './db'

import {makeStyles} from '@material-ui/core/styles'
import {FormControlLabel, Grid, Radio, Checkbox, TextField, Button} from '@material-ui/core'
import {Autocomplete} from '@material-ui/lab'

interface SpecificOption {
  column: string
  tumor: string
  values: string[]
}

interface VariantOption {
  column: string
  values: string[]
}

export interface Conf {
  variant_values: VariantOption[]
  tumor_specific_values: SpecificOption[]
  cells: string[]
  tumors: string[]
  tumor_codes: Record<string, string>
}

type State = Record<string, string[]> & {
  tumors: string[]
  cells: string[]
}

function calculate_state0(conf: Conf, key_prefix: string): State {
  const state0 = {} as State
  conf.variant_values.forEach(v => {
    state0[v.column] = v.values
  })
  conf.tumor_specific_values.forEach(v => {
    state0[v.column + ',' + v.tumor] = v.values
  })
  state0.cells = []
  state0.tumors = ['BRCA']
  if (key_prefix == 'A') {
    state0.pN_stage = state0.pN_stage.slice(0, 1)
  } else if (key_prefix == 'B') {
    state0.pN_stage = state0.pN_stage.slice(1, 2)
  }
  return state0
}

type KMState = Record<string, string[]> & {
  location: string
  tumor: string
  cell: string
  num_groups: number
}

function calculate_KMstate0(conf: Conf): KMState {
  const state0 = {} as KMState
  conf.variant_values.forEach(v => {
    state0[v.column] = v.values
  })
  conf.tumor_specific_values.forEach(v => {
    state0[v.column + ',' + v.tumor] = v.values
  })
  state0.cell = conf.cells.includes('CD4') ? 'CD4' : conf.cells[0]
  state0.tumor = conf.tumors[0]
  state0.location = 'TUMOR'
  state0.num_groups = 2
  return state0
}

import BarChartIcon from '@material-ui/icons/BarChart'

function memo(deps: any[], elem: () => React.ReactElement): React.ReactElement {
  return React.useMemo(elem, deps)
}

export interface FormProps {
  conf: Conf
  onSubmit?: (...form_values: Record<string, any>[]) => void

  /** For testing */
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

type Action = () => void

function Buttons(props: {onReset: Action; onSubmit: Action; children?: React.ReactNode}) {
  return (
    <Grid item container justify="center" spacing={2} style={{marginTop: 6}}>
      {props.children}
      <Grid item>
        <Button variant="contained" onClick={props.onReset}>
          Reset
        </Button>
      </Grid>
      <Grid item>
        <Button
          variant="contained"
          color="primary"
          startIcon={<BarChartIcon />}
          onClick={props.onSubmit}>
          Plot
        </Button>
      </Grid>
    </Grid>
  )
}

const useStyles = makeStyles({
  Form: {
    ...ui.flex_column,
    '& > .MuiAutocomplete-root': {
      paddingBottom: '1em',
    },
    '& h2:first-child': {
      marginTop: 0,
    },
  },
})

export function Form({conf, onSubmit, onState}: FormProps) {
  const {state, reset, form} = useForm(conf)

  // React.useEffect(() => onSubmit(prepare_state_for_backend(state, conf)), [])

  const get_form_values = () => [prepare_state_for_backend(state, conf)]

  onState && onState(...get_form_values())

  ui.useWhyChanged(Form, {conf, state})

  const classes = useStyles()
  return (
    <div className={classes.Form}>
      {form}
      <Buttons onReset={reset} onSubmit={() => onSubmit && onSubmit(...get_form_values())} />
    </div>
  )
}

export function TwoForms({conf, onSubmit, onState}: FormProps) {
  const names = 'AB'

  const A = useForm(conf, names[0])
  const B = useForm(conf, names[1])

  const forms = [A, B]

  const get_form_values = () => forms.map(form => prepare_state_for_backend(form.state, conf))

  const on_submit = () => onSubmit && onSubmit(...get_form_values())

  onState && onState(...get_form_values())

  const reset = () => ReactDOM.unstable_batchedUpdates(() => forms.forEach(form => form.reset()))

  // React.useEffect(() => on_submit(), [])

  const [do_stitch, box_stitch] = ui.useCheckbox('stitch', false)

  ui.useWhyChanged(Form, {conf, A_state: A.state, B_state: B.state, do_stitch})

  function stitch<A>(xs: A[][]): A[] {
    const [y, ...ys] = xs
    return y.flatMap((a, i) => [a, ...ys.map(y => y[i])])
  }

  const classes = useStyles()
  return (
    <div className={classes.Form}>
      {do_stitch
        ? stitch(forms.map(form => form.form))
        : forms.map((form, i) => [<h2 key={names[i]}>Group {names[i]}</h2>, form.form])}
      <Buttons onReset={reset} onSubmit={on_submit}>
        <Grid item style={{display: 'none'}}>
          {box_stitch}
        </Grid>
      </Buttons>
    </div>
  )
}

interface SpecificsProps {
  options: SpecificOption[]
  visible: (option: SpecificOption) => boolean
  store: Store<Record<string, string[]>>
}

function Specifics(props: SpecificsProps) {
  const state = props.store.get()
  return (
    <>
      {props.options.map(option => {
        const {column, tumor, values} = option
        const key = column + ',' + tumor
        const visible = props.visible(option)
        return memo([state[key], visible, values], () =>
          visible ? (
            <Autocomplete
              key={key}
              multiple
              options={values}
              disableCloseOnSelect
              renderOption={(option, {selected}) => (
                <label>
                  <Checkbox
                    size="small"
                    style={{marginRight: 8, padding: 0}}
                    checked={selected}
                    color="primary"
                  />
                  {utils.pretty(option)}
                </label>
              )}
              renderInput={params => {
                const error = !state[key].length
                return (
                  <TextField
                    {...params}
                    variant="outlined"
                    label={key.replace(',', ' ')}
                    error={error}
                    helperText={error && 'Need at least one option'}
                  />
                )
              }}
              size="small"
              onChange={(_, selected) => props.store.update({[key]: selected})}
              value={state[key] || values}
            />
          ) : (
            <React.Fragment key={key} />
          )
        )
      })}
    </>
  )
}

interface VariantsProps {
  options: VariantOption[]
  store: Store<Record<string, string[]>>
}

import {cell_color} from './cell_colors'

const useVariantsStyles = makeStyles({
  Checkbox: {
    '& > label': {
      textAlign: 'center',
      cursor: 'pointer',
      border: '2px #bbb solid',
      background: '#fafafa',
      display: 'block',
      color: '#333',
      borderRadius: 16,
      padding: '3 8',
      margin: '5 2',
      minWidth: '3.5em',
      '&:focus-within': {
        borderColor: '#888',
      },
    },
  },
  Checked: {
    '& > label': {
      background: cell_color('iDC'),
      borderColor: cell_color('iDC'),
      color: '#fff',
    },
  },
})

function Variants(props: VariantsProps) {
  const state = props.store.get()
  const classes = useVariantsStyles()
  const [handled_at_mousedown, set_handled_at_mousedown] = React.useState(false)
  return (
    <>
      {props.options.map(({column, values}) =>
        memo([state[column], values, handled_at_mousedown], () => (
          <div key={column} style={{...ui.flex_row, alignItems: 'baseline'}}>
            <div style={{width: '3.5cm'}}>
              {column
                .replace(/(_|yesno)/g, ' ')
                .replace(/type/g, '')
                .replace(/^p/, '')
                .replace(/ +/, ' ')
                .trim()}
            </div>
            {values.map(value => {
              const checked = (state[column] || values).includes(value)
              const h = (e: React.MouseEvent | React.ChangeEvent) => {
                if (
                  e.nativeEvent.type != 'click' &&
                  'buttons' in e.nativeEvent &&
                  !e.nativeEvent.buttons
                ) {
                  return
                }
                if (e.nativeEvent.type == 'mousedown') {
                  if (!handled_at_mousedown) {
                    set_handled_at_mousedown(true)
                  }
                }
                if (e.nativeEvent.type == 'click') {
                  if (handled_at_mousedown) {
                    set_handled_at_mousedown(false)
                    return
                  }
                }
                const prev: string[] = state[column] || values
                const checked = !prev.find(n => n == value)
                const selected = prev
                  .slice()
                  .filter(x => x != value || checked)
                  .concat(checked ? [value] : [])
                const new_value = selected.length ? selected : prev
                // : values.filter(x => !prev.includes(x))
                props.store.update({[column]: new_value})
              }
              return (
                <div
                  key={value}
                  className={classes.Checkbox + ' ' + (checked ? classes.Checked : '')}>
                  <label onMouseEnter={h} onMouseDown={h}>
                    <input
                      type="checkbox"
                      style={{position: 'absolute', left: -9999}}
                      checked={checked}
                      onChange={h}
                    />
                    {value}
                  </label>
                </div>
              )
            })}
          </div>
        ))
      )}
    </>
  )
}

interface SelectProps<Multi extends boolean, Selection = Multi extends true ? string[] : string> {
  options: string[]
  codeFor?: (option: string) => string
  value: Selection
  label: string
  defaultValue?: Selection
  onChange: (ev: React.ChangeEvent<{}>, value: Selection) => void
}

function SelectMany(props: SelectProps<true>) {
  return (
    <Autocomplete
      multiple
      options={props.options}
      disableCloseOnSelect
      renderOption={(option, {selected}) => (
        <>
          <label>
            <Checkbox
              size="small"
              style={{marginRight: 8, padding: 0}}
              checked={selected}
              color="primary"
            />
            {utils.pretty(option)}
          </label>
          {props.codeFor && (
            <i style={{paddingLeft: 8, whiteSpace: 'nowrap', fontSize: '0.8em'}}>
              ({props.codeFor(option)})
            </i>
          )}
        </>
      )}
      fullWidth={true}
      renderInput={params => <TextField {...params} variant="outlined" label={props.label} />}
      style={{width: '100%'}}
      onChange={(ev, selected) => props.onChange(ev, selected)}
      value={props.value}
    />
  )
}

function SelectOne(props: SelectProps<false>) {
  return (
    <Autocomplete
      renderOption={(option, {selected}) => (
        <div style={{display: 'flex', alignItems: 'center'}}>
          <label style={{display: 'flex'}}>
            <Radio
              size="small"
              style={{marginRight: 8, padding: 0}}
              checked={selected}
              color="primary"
            />
            {utils.pretty(option)}
          </label>
          {props.codeFor && (
            <i style={{paddingLeft: 8, whiteSpace: 'nowrap', fontSize: '0.8em'}}>
              ({props.codeFor(option)})
            </i>
          )}
        </div>
      )}
      fullWidth={true}
      renderInput={params => <TextField {...params} variant="outlined" label={props.label} />}
      style={{width: '100%'}}
      options={props.options}
      onChange={(ev, maybe_value) => props.onChange(ev, maybe_value ?? props.defaultValue ?? '')}
      value={props.value}
    />
  )
}

function useForm(conf: Conf, key_prefix = '') {
  const state0 = React.useMemo(() => calculate_state0(conf, key_prefix), [conf, key_prefix])

  const [store, state, update_state] = ui.useStore(state0)

  const {tumors, cells} = state

  const tumor_type = memo([tumors, cells], () => (
    <SelectMany
      key={key_prefix + ':tumors'}
      options={conf.tumors}
      codeFor={tumor => conf.tumor_codes[tumor]}
      label={'Tumor types' + (cells.length ? ' (cells selected, comparing across all tumors)' : '')}
      {...store.at('tumors', (selected: string[]) => ({
        tumors: utils.last(3, selected),
        cells: [],
      }))}
    />
  ))

  const cell_type = memo([tumors, cells], () => (
    <SelectMany
      key={key_prefix + ':cells'}
      options={cellOrder.filter(cell => conf.cells.includes(cell))}
      label={'Cell types' + (tumors.length ? ' (tumors selected, comparing across cells)' : '')}
      {...store.at('cells', (selected: string[]) => ({
        tumors: [],
        cells: utils.last(3, selected),
      }))}
    />
  ))

  const specifics = (
    <Specifics
      key={key_prefix + 'specifics'}
      options={conf.tumor_specific_values}
      visible={t => !!cells.length || tumors.includes(t.tumor)}
      store={store}
    />
  )

  const variants = (
    <Variants key={key_prefix + 'variants'} options={conf.variant_values} store={store} />
  )

  return {
    state,
    reset: () => update_state(state0),
    form: [tumor_type, cell_type, specifics, variants],
  }
}

function useKMForm(conf: Conf) {
  const state0 = React.useMemo(() => calculate_KMstate0(conf), [conf])

  const [store, state, update_state] = ui.useStore(state0)

  const {tumor, cell} = state

  const tumor_type = memo([tumor], () => (
    <SelectOne
      key="tumors"
      options={conf.tumors}
      codeFor={tumor => conf.tumor_codes[tumor]}
      label="Tumor type"
      defaultValue={state0.tumor}
      {...store.at('tumor')}
    />
  ))

  const cell_type = memo([cell], () => (
    <SelectOne
      key="cells"
      options={cellOrder.filter(cell => conf.cells.includes(cell))}
      // map(utils.pretty) // hmm??

      label="Cell type"
      defaultValue={state0.cell}
      {...store.at('cell')}
    />
  ))

  const specifics = (
    <Specifics
      key="specifics"
      options={conf.tumor_specific_values}
      visible={t => tumor == t.tumor}
      store={store}
    />
  )

  const variants = <Variants key="variants" options={conf.variant_values} store={store} />

  return {
    state,
    reset: () => update_state(state0),
    form: [tumor_type, cell_type, specifics, variants],
  }
}

export function KMForm({conf, onSubmit, onState}: FormProps) {
  const {state, reset, form} = useKMForm(conf)

  // React.useEffect(() => onSubmit(prepare_state_for_backend(state, conf)), [])

  const get_form_values = () => {
    const expanded = utils.expand(state)
    return {
      ...expanded,
      tumors: [expanded.tumor],
    }
  }

  onState && onState(get_form_values())

  ui.useWhyChanged(KMForm, {conf, state, onSubmit})

  const classes = useStyles()
  return (
    <div className={classes.Form}>
      {form}
      <Buttons onReset={reset} onSubmit={() => onSubmit && onSubmit(get_form_values())} />
    </div>
  )
}
