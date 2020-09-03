import * as React from 'react'
import * as ReactDOM from 'react-dom'

import * as utils from './utils'

import * as ui from './ui_utils'
import {Store} from './ui_utils'

import {cellOrder} from './db'

import * as cell_colors from './cell_colors'

import {makeStyles} from '@material-ui/core/styles'
import {FormControlLabel, Grid, Radio, Checkbox, TextField, Button} from '@material-ui/core'
import {Autocomplete} from '@material-ui/lab'

import {CheckboxRow} from './CheckboxRow'

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
  state0.cells = [conf.cells.includes('CD4') ? 'CD4' : conf.cells[0]]
  state0.tumors = ['BRCA']
  // if (key_prefix == 'A') {
  //   state0.pN_stage = state0.pN_stage.slice(0, 1)
  // } else if (key_prefix == 'B') {
  //   state0.pN_stage = state0.pN_stage.slice(1, 2)
  // }
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
    '& .MuiAutocomplete-root': {
      paddingBottom: 10,
    },
    '& h2:first-of-type': {
      marginTop: 0,
    },
    '& h2': {
      fontSize: '1.1rem',
      alignSelf: 'flex-end',
      marginBottom: 5,
    },
  },
  SelectRadio: {
    margin: '5 0 15',
    // alignSelf: 'flex-begin',
    '& .MuiFormControl-root': {
      ...ui.flex_row,
      justifyContent: 'center',
      paddingRight: 10,
      alignItems: 'center',
      '& *': {
        verticalAlign: 'baseline',
      },
      '& label': {
        lineHeight: 'unset',
        color: 'rgba(0, 0, 0, 0.87)',
      },
      '& .MuiFormGroup-root': {
        ...ui.flex_row,
        '& label': {
          ...ui.flex_row,
          '& .MuiFormControlLabel-label': {},
          margin: 0,
          '& .MuiButtonBase-root': {
            padding: '0 9',
          },
        },
      },
    },
  },
})

function useSelectRadio() {
  const classes = useStyles()
  const [select_type, select_radio_inner] = ui.useRadio('Select', ['tumors', 'cells'])
  const select_radio = <div className={classes.SelectRadio}>{select_radio_inner}</div>
  const select_types = {[select_type]: true} as Record<typeof select_type, boolean>
  return [select_types, select_radio] as const
}

export function Form({conf, onSubmit, onState}: FormProps) {
  const [select_types, select_radio] = useSelectRadio()

  const {state, reset, form} = useForm(conf, select_types, true)

  // React.useEffect(() => onSubmit(prepare_state_for_backend(state, conf)), [])

  const get_form_values = () => [prepare_state_for_backend(state, conf)]

  onState && onState(...get_form_values())

  ui.useWhyChanged(Form, {conf, state})

  const classes = useStyles()
  return (
    <div className={classes.Form}>
      {select_radio}
      {form}
      <Buttons onReset={reset} onSubmit={() => onSubmit && onSubmit(...get_form_values())} />
    </div>
  )
}

export function TwoForms({conf, onSubmit, onState}: FormProps) {
  const [select_types, select_radio] = useSelectRadio()

  const names = 'AB'

  const A = useForm(conf, select_types, false, names[0])
  const B = useForm(conf, select_types, false, names[1])

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
      {select_radio}
      {do_stitch
        ? stitch(forms.map(form => form.form))
        : forms.map((form, i) => [
            <h2 key={'h2' + names[i]}>Group {names[i]}</h2>,
            <div
              key={'div' + names[i]}
              style={
                {
                  '--checkbox-bg': cell_colors.color_scheme[i],
                  // '--checkbox-fg': cell_colors.color_scheme_fg[i],
                } as any
              }>
              {form.form}
            </div>,
          ])}
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

const useVariantStyles = makeStyles({
  VariantRow: {
    ...ui.flex_row,
    alignItems: 'baseline',
    '& .variant-label': {
      width: 130,
    },
  },
})

export function Variants(props: VariantsProps) {
  const classes = useVariantStyles()
  return (
    <>
      {props.options.map(({column, values}) => (
        <div key={column} className={classes.VariantRow}>
          <div className="variant-label">
            {column
              .replace(/(_|yesno)/g, ' ')
              .replace(/type/g, '')
              .replace(/^p/, '')
              .replace(/ +/, ' ')
              .trim()}
          </div>
          {CheckboxRow(values, column, props.store)}
        </div>
      ))}
    </>
  )
}

interface SelectProps {
  options: string[]
  codeFor?: (option: string) => string
  value: string[]
  label: string
  defaultValue?: string[]
  onChange: (ev: React.ChangeEvent<{}>, value: string[]) => void
}

function Select(props: SelectProps & {multi: boolean}) {
  if (props.multi) {
    return <SelectMany {...props} />
  } else {
    return <SelectOne {...props} />
  }
}

function SelectMany(props: SelectProps) {
  return (
    <Autocomplete
      multiple
      options={props.options}
      disableCloseOnSelect
      renderOption={(option, {selected}) => (
        <>
          <label style={{...ui.flex_row, minWidth: 100}}>
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

function SelectOne(props: SelectProps) {
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
      onChange={(ev, maybe_value) =>
        props.onChange(ev, maybe_value ? [maybe_value] : props.defaultValue ?? [])
      }
      value={props.value[0] ?? ''}
    />
  )
}

function useForm(
  conf: Conf,
  select_types: Record<'tumors' | 'cells', boolean>,
  multi: boolean,
  key_prefix = ''
) {
  const state0 = React.useMemo(() => calculate_state0(conf, key_prefix), [conf, key_prefix])

  const [store, state, update_state] = ui.useStore(state0)

  const {tumors, cells} = state

  React.useLayoutEffect(() => {
    const state = store.get()
    if (!select_types.tumors && state.tumors.length) {
      store.update({tumors: []})
    }
    if (!select_types.cells && state.cells.length) {
      store.update({cells: []})
    }
  }, [select_types])

  const numerus = (tumor: string) => tumor + (multi ? 's' : '')

  const tumor_type = memo([select_types, tumors, cells], () => (
    <React.Fragment key={key_prefix + ':tumors'}>
      {select_types.tumors && (
        <Select
          multi={multi}
          options={conf.tumors}
          codeFor={tumor => conf.tumor_codes[tumor]}
          label={numerus('Tumor type')}
          {...store.at('tumors', (selected: string[]) => ({
            tumors: utils.last(3, selected),
            cells: select_types.cells ? store.get().cells : [],
          }))}
        />
      )}
    </React.Fragment>
  ))

  const cell_type = memo([select_types, tumors, cells], () => (
    <React.Fragment key={key_prefix + ':cells'}>
      {select_types.cells && (
        <Select
          multi={multi}
          options={cellOrder.filter(cell => conf.cells.includes(cell))}
          label={numerus('Cell type')}
          {...store.at('cells', (selected: string[]) => ({
            tumors: select_types.tumors ? store.get().tumors : [],
            cells: utils.last(3, selected),
          }))}
        />
      )}
    </React.Fragment>
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

export function KMForm({conf, onSubmit, onState}: FormProps) {
  const {state, reset, form} = useForm(conf, {cells: true, tumors: true}, false)

  // React.useEffect(() => onSubmit(prepare_state_for_backend(state, conf)), [])

  const get_form_values = () => {
    const expanded = utils.expand(state)
    return {
      ...expanded,
      cell: (expanded.cells as any)[0],
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
