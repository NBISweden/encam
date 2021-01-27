/**

  Checkboxes which look like pills and can be toggled by hovering while
  having mouse clicked down!!

*/
import {css, cx} from 'emotion'

import * as React from 'react'
import * as utils from './utils'
import * as ui from './ui_utils'
import * as adhoc from './adhoc'

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
      background: `var(--checkbox-bg, ${adhoc.color_scheme[0]})`,
      borderColor: `var(--checkbox-bg, ${adhoc.color_scheme[0]})`,
      color: `var(--checkbox-fg, ${adhoc.color_scheme_fg[0]})`,
    },
  }),
}

export function useCheckboxRow({
  options,
  init_value,
  labelBy,
}: {
  options: string[]
  init_value?: string[]
  labelBy?: (s: string) => string
}) {
  const [value, set] = React.useState(init_value ?? options)
  const last_event_type_ref = React.useRef('')
  ui.useAssertConstant(options.toString)
  const node = ui.useMemoComponent([value], () => (
    <>
      {options.map(option => {
        const checked = value.includes(option)
        const h = (e: React.MouseEvent | React.ChangeEvent) => {
          const last_event_type = last_event_type_ref.current
          last_event_type_ref.current = e.type
          if (e.type === 'change' && last_event_type === 'mouseup') {
            // ignore because double events sent from mouse click: mouseup followed by change
            return
          }
          if (e.type == 'mouseup') {
            // mouseup never makes any changes
            return
          }
          if (e.type == 'mouseenter') {
            // if we enter we want to toggle
            if ((e.nativeEvent as MouseEvent).buttons == 0) {
              // but only if buttons are pressed
              return
            }
          }
          const prev = value
          const selected = prev
            .slice()
            .filter(x => x != option || !checked)
            .concat(!checked ? [option] : [])
          const next = selected.length ? selected : prev
          set(next)
        }
        return (
          <div key={option} className={cx(classes.CheckboxRow, {checked})}>
            <label
              onMouseEnter={h}
              onMouseDown={h}
              onMouseUp={h}
              onDoubleClick={() => {
                // double click toggles between
                if (utils.equal(value, [option])) {
                  // all selected
                  set(options)
                } else {
                  // only me selected
                  set([option])
                }
              }}>
              <input
                type="checkbox"
                style={{position: 'absolute', left: '-9999px'}}
                checked={checked}
                onChange={h}
              />
              {labelBy ? labelBy(option) : option}
            </label>
          </div>
        )
      })}
    </>
  ))
  return {value, set, node}
}
