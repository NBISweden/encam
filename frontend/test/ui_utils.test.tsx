import * as React from 'react'
import * as ui from '../src/ui_utils'
import {render, fireEvent, screen, act} from '@testing-library/react'

describe(ui.useCheckboxes, () => {
  const keys = 'ctrlKey shiftKey altKey'.split(' ')
  keys.forEach(key => {
    test(`holding down ${key} toggles`, () => {
      let $selected
      function Component() {
        const [selected, dom] = ui.useCheckboxes('a b c'.split(' '), {a: true})
        $selected = {...selected}
        return dom
      }

      render(<Component/>)

      expect($selected).toStrictEqual({'a': true})

      fireEvent.click(screen.getByLabelText('c'))

      expect($selected).toStrictEqual({'a': true, 'c': true})

      fireEvent.click(screen.getByLabelText('a'))

      expect($selected).toStrictEqual({'a': false, 'c': true})

      fireEvent.click(screen.getByLabelText('a'), {[key]: true})

      expect($selected).toStrictEqual({'a': true})

      fireEvent.click(screen.getByLabelText('a'), {[key]: true})

      expect($selected).toStrictEqual({'a': true, 'b': true, 'c': true})
    })
  })

  test('alternatives can be changed', () => {
    let $set_alts: any
    let $selected
    function Component() {
      const [alts, set_alts] = React.useState('a b c'.split(' '))
      $set_alts = set_alts
      const [selected, dom] = ui.useCheckboxes(alts, {[alts[0]]: true})
      $selected = {...selected}
      return dom
    }

    render(<Component/>)

    expect($selected).toStrictEqual({'a': true})

    act(() => {
      $set_alts('x y'.split(' '))
    })

    expect($selected).toStrictEqual({'x': true})
  })
})

describe(ui.useStateWithUpdate, () => {
  test('updates correctly', () => {
    let $state
    function Component() {
      const [state, update_state] = ui.useStateWithUpdate({a: 1, b: 2})
      $state = {...state}
      const on_click =() => {
        if (state.a < 2) {
          update_state({a: 2})
        } else {
          update_state(s => ({b: s.b + 1}))
        }
      }
      return <div onClick={on_click}>hit me</div>
    }
    render(<Component/>)
    expect($state).toStrictEqual({a: 1, b: 2})

    fireEvent.click(screen.getByText('hit me'))
    expect($state).toStrictEqual({a: 2, b: 2})

    fireEvent.click(screen.getByText('hit me'))
    expect($state).toStrictEqual({a: 2, b: 3})

    fireEvent.click(screen.getByText('hit me'))
    expect($state).toStrictEqual({a: 2, b: 4})
  })
})
