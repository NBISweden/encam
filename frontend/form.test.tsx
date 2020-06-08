
import * as React from 'react'
import * as form from './form'

import * as utils from './utils'

import {form_test_conf} from './form_test_data'

import {render, fireEvent, screen, waitFor} from '@testing-library/react'
import * as q from '@testing-library/react'

type State = Record<string, any>

const setup = () => {
  let ref = {
    prev: undefined as State | undefined,
    now: undefined as State | undefined,
    diff: undefined as Partial<State> | undefined,
  }

  const on_state = (...xs: State[]) => {
    expect(xs).toHaveLength(1)
    const s = xs[0]
    ref.prev = ref.now && {...ref.now}
    ref.now = {...s}
    ref.diff = utils.simple_object_diff(ref.prev || {}, ref.now)
  }

  render(<form.Form conf={form_test_conf} onState={on_state}/>)

  expect(ref.prev).toBeUndefined()
  expect(ref.now).not.toBeUndefined()
  expect(ref.diff).toEqual(ref.now)

  return ref
}

test('can select and deselect options', async () => {
  const ref = setup()

  fireEvent.click(screen.getByLabelText('low'))
  expect(ref.diff).toStrictEqual({'Diff_grade': ['high', 'missing']})

  fireEvent.click(screen.getByLabelText('high'))
  expect(ref.diff).toStrictEqual({'Diff_grade': ['missing']})

  // wrap-around
  fireEvent.click(screen.getAllByLabelText('missing')[0])
  expect(ref.diff).toStrictEqual({'Diff_grade': ['high', 'low']})

  fireEvent.click(screen.getAllByLabelText('missing')[1])
  expect(ref.diff).toStrictEqual({'Neuralinv': ['No', 'Yes']})

  fireEvent.click(screen.getAllByLabelText('missing')[0])
  expect(ref.diff).toStrictEqual({'Diff_grade': ['high', 'low', 'missing']})
})

test('can select up to 3 tumor types', async () => {
  const ref = setup()

  // Clicking the label on the autocomplete does not open it!
  // // fireEvent.click(screen.getByLabelText(/Tumor types/))

  fireEvent.click(screen.getAllByLabelText(/Open/)[0])
  expect(ref.prev).toBeUndefined()

  await waitFor(() => screen.getByLabelText('COAD'))
  expect(ref.prev).toBeUndefined()

  fireEvent.click(screen.getByLabelText('COAD'))
  expect(ref.diff).toStrictEqual({tumors: ['BRCA', 'COAD']})

  fireEvent.click(screen.getByLabelText('READ'))
  expect(ref.diff).toStrictEqual({tumors: ['BRCA', 'COAD', 'READ']})
  fireEvent.click(screen.getByLabelText('MEL'))
  expect(ref.diff).toStrictEqual({tumors: ['COAD', 'READ', 'MEL']})

  fireEvent.click(screen.getByLabelText('MEL'))
  expect(ref.diff).toStrictEqual({tumors: ['COAD', 'READ']})

  fireEvent.click(screen.getByLabelText('BRCA'))
  expect(ref.diff).toStrictEqual({tumors: ['COAD', 'READ', 'BRCA']})

})
