/**

  Checkboxes which look like pills and can be toggled by hovering while
  having mouse clicked down!!

*/
import {css, cx} from 'emotion'

import * as React from 'react'

import * as utils from './utils'

import {Store} from './ui_utils'

import * as cell_colors from './cell_colors'

const classes = {
  CheckboxRow: css({
    '& label': {
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
      padding: '3px 9px',
      margin: '5px 2px',
      minWidth: 50,
      '.small-checkbox-row &': {
        margin: '2px 2px',
        padding: '3px 8px 1px',
        fontSize: '0.73rem',
        borderWidth: 1.5,
        minWidth: 'unset',
      },
    },
    '&.checked label': {
      background: `var(--checkbox-bg, ${cell_colors.color_scheme[0]})`,
      borderColor: `var(--checkbox-bg, ${cell_colors.color_scheme[0]})`,
      color: `var(--checkbox-fg, ${cell_colors.color_scheme_fg[0]})`,
    },
  }),
}

export function CheckboxRow({
  values,
  column,
  store,
  labelBy,
}: {
  values: string[]
  column: string
  store: Store<Record<string, string[]>>
  labelBy?: (s: string) => string
}) {
  const state = store.get()
  const [handled_at_mousedown, set_handled_at_mousedown] = React.useState(false)
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
          <div key={value} className={cx(classes.CheckboxRow, {checked})}>
            <label
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
                style={{position: 'absolute', left: '-9999px'}}
                checked={checked}
                onChange={h}
              />
              {labelBy ? labelBy(value) : value}
            </label>
          </div>
        )
      })}
    </>
  )
}
