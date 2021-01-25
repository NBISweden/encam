import * as React from 'react'
import * as ui from '../src/ui_utils'
import {render, fireEvent, screen, act} from '@testing-library/react'

describe(ui.useStateWithUpdate, () => {
  test('updates correctly', () => {
    let $state
    function Component() {
      const [state, update_state] = ui.useStateWithUpdate({a: 1, b: 2})
      $state = {...state}
      const on_click = () => {
        if (state.a < 2) {
          update_state({a: 2})
        } else {
          update_state(s => ({b: s.b + 1}))
        }
      }
      return <div onClick={on_click}>hit me</div>
    }
    render(<Component />)
    expect($state).toStrictEqual({a: 1, b: 2})

    fireEvent.click(screen.getByText('hit me'))
    expect($state).toStrictEqual({a: 2, b: 2})

    fireEvent.click(screen.getByText('hit me'))
    expect($state).toStrictEqual({a: 2, b: 3})

    fireEvent.click(screen.getByText('hit me'))
    expect($state).toStrictEqual({a: 2, b: 4})
  })
})
