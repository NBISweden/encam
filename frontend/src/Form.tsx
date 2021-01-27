/**

  The Forms which specify what data should be shown in the plots.

  The different fields and their possible values come from the backend
  so that the underlying database and its options can be changed on the fly.

*/
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import * as utils from './utils'
import * as adhoc from './adhoc'

import * as ui from './ui_utils'
import type {Store} from './ui_utils'

import {makeStyles} from '@material-ui/core/styles'
import {Grid, Radio, Checkbox, TextField, Button} from '@material-ui/core'
import {Autocomplete} from '@material-ui/lab'

import BarChart from '@material-ui/icons/BarChart'

import {useCheckboxRow} from './CheckboxRow'

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

type State = {
  tumors: string[]
  cells: string[]
  specifics: {
    [column: string]: {
      [tumor: string]: string[]
    }
  }
  variants: Record<string, string[]>
}

function calculate_state0(conf: Conf): State {
  const state0 = {variants: {}, specifics: {}} as State
  conf.variant_values.forEach(v => {
    state0.variants[v.column] = v.values
  })
  conf.tumor_specific_values.forEach(v => {
    if (!state0.specifics[v.column]) {
      state0.specifics[v.column] = {}
    }
    state0.specifics[v.column][v.tumor] = v.values
  })
  const default_cell = 'CD4'
  state0.cells = [conf.cells.includes(default_cell) ? default_cell : conf.cells[0]]
  state0.tumors = ['BRCA']
  return state0
}

export interface FormProps {
  conf: Conf
  onSubmit?: (...form_values: Record<string, any>[]) => void

  /** For testing */
  onState?: (...form_values: Record<string, any>[]) => void
}

function prepare_state_for_backend(state0: State, conf: Conf) {
  let {specifics, variants, ...state} = {...state0}
  const flat_state: Record<string, any> = {...specifics, ...variants, ...state}
  let facet
  if (state0.cells.length == 0) {
    flat_state.cells = conf.cells
    facet = 'cell'
  }
  if (state0.tumors.length == 0) {
    flat_state.tumors = conf.tumors
    facet = 'tumor'
  }
  return {
    ...flat_state,
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
    margin: '5px 0px 15px',
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
            padding: '0 9px',
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

  // ui.useWhyChanged(Form, {conf, state})

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

  // ui.useWhyChanged(Form, {conf, A_state: A.state, B_state: B.state, do_stitch})

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
                  '--checkbox-bg': adhoc.color_scheme[i],
                  // '--checkbox-fg': adhoc.color_scheme_fg[i],
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
      marginBottom: 10,
      marginTop: 0,
      '&$expanded': {
        marginBottom: 20,
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
    margin: '12px 0',
    '&$expanded': {
      margin: '12px 0',
    },
  },
  expanded: {},
  expandIcon: {
    padding: 2,
    transition: 'none',
  },
})(MuiAccordionSummary)

const useAccordionStyles = makeStyles(theme => ({
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

interface AccordionProps {
  options: SpecificOption[]
  column: string
  visible: (option: SpecificOption) => boolean
}

function useAccordion(props: AccordionProps) {
  const classes = useAccordionStyles()
  const [expanded, set_expanded] = React.useState(false)
  ui.useAssertConstant(props.options, props.column)
  const {column} = props
  const options: typeof props.options = []

  for (const option of props.options) {
    if (option.column == column) {
      options.push(option)
    }
  }

  const checkbox_rows: Record<string, ui.State<string[]> & {node: React.ReactNode}> = {}
  const values = []

  for (const option of options) {
    const cb_row = useCheckboxRow({options: option.values})
    checkbox_rows[option.tumor] = cb_row
    values.push(cb_row.value)
  }

  const node = React.useMemo(() => {
    const trs = []
    for (const option of options) {
      const cb_row = checkbox_rows[option.tumor]
      trs.push(
        props.visible(option) && (
          <tr key={option.tumor}>
            <td>{option.tumor}</td>
            <td style={{...ui.flex_row, flexWrap: 'wrap'}}>{cb_row.node}</td>
          </tr>
        )
      )
    }

    const visible_options = options.filter(props.visible)

    const edited = visible_options.some(
      option => !utils.multiset_equal(checkbox_rows[option.tumor].value, option.values)
    )
    const n = visible_options.length
    let options_text = n + ' ' + utils.pluralise(n > 1, 'option') + (edited ? ', edited' : '')

    if (n === 0) {
      options_text = 'no options'
    }

    options_text = '(' + options_text + ')'

    return (
      <Accordion
        key={column}
        expanded={(expanded && options.some(props.visible)) || false}
        onChange={(_, e) => set_expanded(e && options.some(props.visible))}>
        <AccordionSummary expandIcon={<ArrowDropDownIcon />}>
          <span>{adhoc.pretty(column)}</span>
          <span style={{fontSize: '0.95em', color: '#777'}}>{options_text}</span>
        </AccordionSummary>
        <AccordionDetails className={classes.AccordionDetails}>
          <table className={classes.Table}>
            <tbody>{trs}</tbody>
          </table>
        </AccordionDetails>
      </Accordion>
    )
  }, [expanded, props.visible, ...values])

  return {...ui.merge(checkbox_rows), node}
}

interface VariantsProps {
  options: VariantOption[]
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

export function useVariants(props: VariantsProps) {
  const checkbox_rows: Record<string, ui.State<string[]>> = {}
  const node = (
    <>
      {props.options.map(({column, values}) => {
        const cb_row = useCheckboxRow({options: values})
        checkbox_rows[column] = cb_row

        return (
          <div key={column} className={variant_classes.VariantRow}>
            <div className="variant-label">
              {column
                .replace(/(_|yesno)/g, ' ')
                .replace(/type/g, '')
                .replace(/^p/, '')
                .replace(/ +/, ' ')
                .trim()}
            </div>
            {cb_row.node}
          </div>
        )
      })}
    </>
  )
  return {...ui.merge(checkbox_rows), node}
}

interface SelectProps {
  options: string[]
  codeFor?: (option: string) => string
  label: string
  init_value: string[]
  prefix: string
  max_count?: number
}

function useSelect(props: SelectProps & {multi: boolean}) {
  ui.useAssertConstant(
    props.multi,
    props.options.toString(),
    props.label,
    props.prefix,
    props.max_count
  )
  if (props.multi) {
    return useSelectMany(props)
  } else {
    return useSelectOne(props)
  }
}

function useSelectMany(props: SelectProps) {
  const [value, set] = React.useState(props.init_value)
  const node = React.useMemo(
    () => (
      <Autocomplete
        multiple
        options={props.options}
        disableCloseOnSelect
        getOptionLabel={(s: string) => adhoc.pretty(s)}
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
              <label
                htmlFor={props.prefix + '-' + option}
                style={{minWidth: 65, cursor: 'pointer'}}>
                {adhoc.pretty(option)}
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
        onChange={(e, selected) => {
          e.preventDefault() // keep select open
          set(utils.last(props.max_count ?? props.options.length, selected))
        }}
        value={value}
      />
    ),
    [value]
  )
  return {set, value, node}
}

function useSelectOne(props: SelectProps) {
  const [value, set] = React.useState(props.init_value)
  const node = React.useMemo(
    () => (
      <Autocomplete
        getOptionLabel={(s: string) => adhoc.pretty(s)}
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
              <label
                htmlFor={props.prefix + '-' + option}
                style={{minWidth: 65, cursor: 'pointer'}}>
                {adhoc.pretty(option)}
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
        onChange={(_, maybe_value) => set(maybe_value ? [maybe_value] : props.init_value ?? [])}
        value={value[0] ?? ''}
      />
    ),
    [value, ...Object.values(props)]
  )
  return {set, value, node}
}

function useForm(
  conf: Conf,
  select_types: Record<'tumors' | 'cells', boolean>,
  multi: boolean,
  key_prefix = ''
) {
  ui.useAssertConstant(conf)
  const state0 = React.useMemo(() => calculate_state0(conf), [conf])

  const sorted_tumors = React.useMemo(() => adhoc.sort_tumors(conf.tumors), [conf])

  const tumors = useSelect({
    prefix: key_prefix + ':tumors',
    multi: multi,
    options: sorted_tumors,
    codeFor: tumor => conf.tumor_codes[tumor],
    label: utils.pluralise(multi, 'Tumor type'),
    init_value: state0.tumors,
    max_count: 3,
  })

  const sorted_cells = React.useMemo(() => adhoc.sort_cells(conf.cells), [conf])

  const cells = useSelect({
    prefix: key_prefix + ':cells',
    multi: multi,
    options: sorted_cells,
    label: utils.pluralise(multi, 'Cell type'),
    init_value: state0.cells,
    max_count: 3,
  })

  React.useLayoutEffect(() => {
    if (!select_types.tumors && tumors.value.length) {
      tumors.set([])
    }
    if (!select_types.cells && cells.value.length) {
      cells.set([])
    }
  }, [select_types])

  const specific_columns = React.useMemo(
    () => utils.uniq(conf.tumor_specific_values.map(opt => opt.column)),
    [conf]
  )
  const specifics = utils.createObject(
    specific_columns,
    column => column,
    column =>
      useAccordion({
        column,
        options: conf.tumor_specific_values,
        visible: React.useCallback(
          t => (tumors.value.length ? tumors.value.includes(t.tumor) : cells.value.length > 0),
          [tumors.value, cells.value]
        ),
      })
  )

  const variants = useVariants({
    options: conf.variant_values,
  })

  const store = ui.merge({tumors, cells, specifics: ui.merge(specifics), variants})

  const state = store.value

  const valid =
    (!select_types.tumors || state.tumors.length > 0) &&
    (!select_types.cells || state.cells.length > 0)

  return {
    state,
    valid,
    reset: () => store.set(state0),
    form: ui.add_dummy_keys([
      select_types.tumors && tumors.node,
      select_types.cells && cells.node,
      ...Object.values(specifics).map(s => s.node),
      variants.node,
    ]),
  }
}

export function KMForm({conf, onSubmit, onState}: FormProps) {
  const {state, reset, valid, form} = useForm(conf, {cells: true, tumors: true}, false)

  // React.useEffect(() => onSubmit(prepare_state_for_backend(state, conf)), [])

  const get_form_values = () => {
    return {
      ...state,
      cell: (state.cells as any)[0],
    }
  }

  onState && onState(get_form_values())

  // ui.useWhyChanged(KMForm, {conf, state, onSubmit})

  return (
    <div className={classes.Form}>
      {form}
      <Buttons onReset={reset} onSubmit={() => valid && onSubmit && onSubmit(get_form_values())} />
    </div>
  )
}

import {stories} from './ui_utils/stories'
import {form_test_conf} from './data/form'

stories(add => {
  add(
    <Form conf={form_test_conf} />,
    <TwoForms conf={form_test_conf} />,
    <KMForm conf={form_test_conf} />
  )
})
