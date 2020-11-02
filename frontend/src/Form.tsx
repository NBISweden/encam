import * as React from 'react'
import * as ReactDOM from 'react-dom'

import * as utils from './utils'

import * as ui from './ui_utils'
import type {Store} from './ui_utils'

import * as cell_colors from './cell_colors'

import {makeStyles} from '@material-ui/core/styles'
import {Grid, Radio, Checkbox, TextField, Button} from '@material-ui/core'
import {Autocomplete} from '@material-ui/lab'

import BarChart from '@material-ui/icons/BarChart'

import {CheckboxRow} from './CheckboxRow'

import {css} from 'emotion'

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

const specific_key = (s: SpecificOption) => s.column + ',' + s.tumor

function calculate_state0(conf: Conf, key_prefix: string): State {
  const state0 = {} as State
  conf.variant_values.forEach(v => {
    state0[v.column] = v.values
  })
  conf.tumor_specific_values.forEach(v => {
    state0[specific_key(v)] = v.values
  })
  const default_cell = 'CD4'
  state0.cells = [conf.cells.includes(default_cell) ? default_cell : conf.cells[0]]
  state0.tumors = ['BRCA']
  return state0
}

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
          startIcon={<BarChart />}
          onClick={props.onSubmit}>
          Plot
        </Button>
      </Grid>
    </Grid>
  )
}

const classes = {
  Form: css({
    width: 420,
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
  }),
  SelectRadio: css({
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
  }),
}

function useSelectRadio() {
  const [select_type, select_radio_inner] = ui.useRadio('Select', ['tumors', 'cells'])
  const select_radio = <div className={classes.SelectRadio}>{select_radio_inner}</div>
  const select_types = {[select_type]: true} as Record<typeof select_type, boolean>
  return [select_types, select_radio] as const
}

export function Form({conf, onSubmit, onState}: FormProps) {
  const [select_types, select_radio] = useSelectRadio()

  const {state, reset, valid, form} = useForm(conf, select_types, true)

  // React.useEffect(() => onSubmit(prepare_state_for_backend(state, conf)), [])

  const get_form_values = () => [prepare_state_for_backend(state, conf)]

  onState && onState(...get_form_values())

  ui.useWhyChanged(Form, {conf, state})

  return (
    <div className={classes.Form}>
      {select_radio}
      {form}
      <Buttons
        onReset={reset}
        onSubmit={() => valid && onSubmit && onSubmit(...get_form_values())}
      />
    </div>
  )
}

export function TwoForms({conf, onSubmit, onState}: FormProps) {
  const [select_types, select_radio] = useSelectRadio()

  const names = 'AB'

  const A = useForm(conf, select_types, false, names[0])
  const B = useForm(conf, select_types, false, names[1])

  const forms = [A, B]

  const valid = forms.every(form => form.valid)

  const get_form_values = () => forms.map(form => prepare_state_for_backend(form.state, conf))

  const on_submit = () => valid && onSubmit && onSubmit(...get_form_values())

  onState && onState(...get_form_values())

  const reset = () => ReactDOM.unstable_batchedUpdates(() => forms.forEach(form => form.reset()))

  // React.useEffect(() => on_submit(), [])

  const [do_stitch, box_stitch] = ui.useCheckbox('stitch', false)

  ui.useWhyChanged(Form, {conf, A_state: A.state, B_state: B.state, do_stitch})

  function stitch<A>(xs: A[][]): A[] {
    const [y, ...ys] = xs
    return y.flatMap((a, i) => [a, ...ys.map(y => y[i])])
  }

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

import {
  Accordion as MuiAccordion,
  AccordionSummary as MuiAccordionSummary,
  AccordionDetails,
} from '@material-ui/core'
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown'

import {withStyles} from '@material-ui/core/styles'

export const Accordion = withStyles(theme => {
  const borderColor =
    theme.palette.type === 'light' ? 'rgba(0, 0, 0, 0.23)' : 'rgba(255, 255, 255, 0.23)'

  return {
    root: {
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor,
      borderRadius: 4,
      marginBottom: '10',
      marginTop: 0,
      '&$expanded': {
        marginBottom: '20',
        marginTop: 0,
      },
      boxShadow: 'none',
    },
    expanded: {},
  }
})(MuiAccordion)

export const AccordionSummary = withStyles({
  root: {
    margin: 'auto',
    transition: 'none',
    '&$expanded': {
      minHeight: 48,
    },
  },
  content: {
    justifyContent: 'space-between',
    margin: '12 0',
    '&$expanded': {
      margin: '12 0',
    },
  },
  expanded: {},
  expandIcon: {
    padding: 2,
    transition: 'none',
  },
})(MuiAccordionSummary)

const useSpecificStyles = makeStyles(theme => ({
  Table: {
    fontSize: 'inherit',
    borderSpacing: 0,
    '& td': {
      padding: 0,
    },
    '& tr:not(:last-child) td': {
      paddingBottom: 5,
    },
    '& td:first-child': {
      minWidth: 60,
      verticalAlign: 'baseline',
    },
    '& tr:hover': {
      '& td:first-child': {
        color: theme.palette.primary.main,
      },
    },
    '& .checkbox-label': {
      marginTop: 0,
    },
  },
  AccordionDetails: {
    paddingTop: 0,
    paddingBottom: 8,
  },
}))

function Specifics(props: SpecificsProps) {
  const [expanded, update_expanded] = ui.useStateWithUpdate({} as Record<string, boolean>)
  const classes = useSpecificStyles()
  const state = props.store.get()

  const options_text = (options: SpecificOption[]) => {
    const visible_options = options.filter(props.visible)

    const edited = visible_options.some(
      option => !utils.multiset_equal(state[specific_key(option)], option.values)
    )
    const edited_text = edited ? ', edited' : ''

    const n = visible_options.length
    if (n === 0) {
      return '(no options)'
    } else if (n === 1) {
      return `(1 option${edited_text})`
    } else {
      return `(${n} options${edited_text})`
    }
  }

  const grouped_options = Object.entries(utils.groupBy('column', props.options))

  return (
    <>
      {grouped_options.map(([column, options]) => (
        <Accordion
          key={column}
          expanded={(expanded[column] && options.some(props.visible)) || false}
          onChange={(_, e) => update_expanded({[column]: e && options.some(props.visible)})}>
          <AccordionSummary expandIcon={<ArrowDropDownIcon />}>
            <span>{utils.pretty(column)}</span>
            <span style={{fontSize: '0.95em', color: '#777'}}>{options_text(options)}</span>
          </AccordionSummary>
          <AccordionDetails className={classes.AccordionDetails}>
            <table className={classes.Table}>
              <tbody>
                {options.map(
                  option =>
                    props.visible(option) && (
                      <tr key={option.tumor}>
                        <td>{option.tumor}</td>
                        <td style={{...ui.flex_row, flexWrap: 'wrap'}}>
                          <CheckboxRow
                            values={option.values}
                            column={specific_key(option)}
                            store={props.store}
                          />
                        </td>
                      </tr>
                    )
                )}
              </tbody>
            </table>
          </AccordionDetails>
        </Accordion>
      ))}
    </>
  )
}

interface VariantsProps {
  options: VariantOption[]
  store: Store<Record<string, string[]>>
}

const variant_classes = {
  VariantRow: css({
    ...ui.flex_row,
    alignItems: 'baseline',
    '& .variant-label': {
      paddingLeft: 8,
      width: 145,
    },
  }),
}

export function Variants(props: VariantsProps) {
  const {store} = props
  return (
    <>
      {props.options.map(({column, values}) => (
        <div key={column} className={variant_classes.VariantRow}>
          <div className="variant-label">
            {column
              .replace(/(_|yesno)/g, ' ')
              .replace(/type/g, '')
              .replace(/^p/, '')
              .replace(/ +/, ' ')
              .trim()}
          </div>
          <CheckboxRow {...{values, column, store}} />
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
  prefix: string
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
      getOptionLabel={(s: string) => utils.pretty(s)}
      renderOption={(option: string, {selected}) => (
        <>
          <div style={{...ui.flex_row}}>
            <Checkbox
              size="small"
              style={{marginRight: 8, padding: 0}}
              checked={selected}
              color="primary"
              id={props.prefix + '-' + option}
            />
            <label htmlFor={props.prefix + '-' + option} style={{minWidth: 65, cursor: 'pointer'}}>
              {utils.pretty(option)}
            </label>
            {props.codeFor && (
              <i style={{paddingLeft: 8, whiteSpace: 'nowrap', fontSize: '0.8em'}}>
                ({props.codeFor(option)})
              </i>
            )}
          </div>
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
      getOptionLabel={(s: string) => utils.pretty(s)}
      renderOption={(option: string, {selected}) => (
        <div style={{display: 'flex', alignItems: 'center'}}>
          <div style={{...ui.flex_row}}>
            <Radio
              size="small"
              style={{marginRight: 8, padding: 0}}
              checked={selected}
              color="primary"
              id={props.prefix + '-' + option}
            />
            <label htmlFor={props.prefix + '-' + option} style={{minWidth: 65, cursor: 'pointer'}}>
              {utils.pretty(option)}
            </label>
            {props.codeFor && (
              <i style={{paddingLeft: 8, whiteSpace: 'nowrap', fontSize: '0.8em'}}>
                ({props.codeFor(option)})
              </i>
            )}
          </div>
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

  const sorted_tumors = React.useMemo(() => utils.sort_tumors(conf.tumors), [conf])

  const tumor_type = memo([select_types, tumors, cells], () => (
    <React.Fragment key={key_prefix + ':tumors'}>
      {select_types.tumors && (
        <Select
          prefix={key_prefix + ':tumors'}
          multi={multi}
          options={sorted_tumors}
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

  const sorted_cells = React.useMemo(() => utils.sort_cells(conf.cells), [conf])

  const cell_type = memo([select_types, tumors, cells], () => (
    <React.Fragment key={key_prefix + ':cells'}>
      {select_types.cells && (
        <Select
          prefix={key_prefix + ':cells'}
          multi={multi}
          options={sorted_cells}
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
      visible={t => (tumors.length ? tumors.includes(t.tumor) : cells.length > 0)}
      store={store}
    />
  )

  const variants = (
    <Variants key={key_prefix + 'variants'} options={conf.variant_values} store={store} />
  )

  const valid =
    (!select_types.tumors || state.tumors.length > 0) &&
    (!select_types.cells || state.cells.length > 0)

  return {
    state,
    valid,
    reset: () => update_state(state0),
    form: [tumor_type, cell_type, specifics, variants],
  }
}

export function KMForm({conf, onSubmit, onState}: FormProps) {
  const {state, reset, valid, form} = useForm(conf, {cells: true, tumors: true}, false)

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

  return (
    <div className={classes.Form}>
      {form}
      <Buttons onReset={reset} onSubmit={() => valid && onSubmit && onSubmit(get_form_values())} />
    </div>
  )
}

import {stories} from './ui_utils/stories'
import {form_test_conf} from './data/form'

stories(
  import.meta,
  <Form conf={form_test_conf} />,
  <TwoForms conf={form_test_conf} />,
  <KMForm conf={form_test_conf} />
)
