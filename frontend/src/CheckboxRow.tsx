import * as React from 'react'

import * as utils from './utils'

import {Store} from './ui_utils'

import {makeStyles} from '@material-ui/core/styles'

import * as cell_colors from './cell_colors'

const useCheckboxRowStyles = makeStyles({
  CheckboxRow: {
    '& .checkbox-label': {
      textAlign: 'center',
      cursor: 'pointer',
      border: '2px #bbb solid',
      background: '#fafafa',
      display: 'block',
      color: '#333',
      borderRadius: 16,
      '&:focus-within': {
        borderColor: '#888',
      },
      padding: '3 9',
      margin: '5 2',
      minWidth: 50,
      '.small-checkbox-row &': {
        margin: '2 2',
        padding: '2 8',
        fontSize: '0.73rem',
        borderWidth: 1.5,
        minWidth: 'unset',
      },
    },
    '&.checked .checkbox-label': {
      background: `var(--checkbox-bg, ${cell_colors.color_scheme[0]})`,
      borderColor: `var(--checkbox-bg, ${cell_colors.color_scheme[0]})`,
      color: `var(--checkbox-fg, ${cell_colors.color_scheme_fg[0]})`,
    },
  },
})

export function CheckboxRow({
  values,
  column,
  store,
}: {
  values: string[]
  column: string
  store: Store<Record<string, string[]>>
}) {
  const state = store.get()
  const [handled_at_mousedown, set_handled_at_mousedown] = React.useState(false)
  const classes = useCheckboxRowStyles()
  return (
    <>
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
          store.update({[column]: new_value})
        }
        return (
          <div key={value} className={classes.CheckboxRow + ' ' + (checked ? 'checked' : '')}>
            <label
              className="checkbox-label"
              onMouseEnter={h}
              onMouseDown={h}
              onDoubleClick={() => {
                if (utils.equal(store.get()[column], [value])) {
                  store.update({[column]: values})
                } else {
                  store.update({[column]: [value]})
                }
              }}>
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
    </>
  )
}
