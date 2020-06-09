
import * as React from 'react'
import * as form from './form'

import * as utils from './utils'

import {form_test_conf} from './form_test_data'

import {within, render, fireEvent, screen, waitFor} from '@testing-library/react'
import * as q from '@testing-library/react'

type State = Record<string, any>

const setup = (on_submit?: form.FormProps['onSubmit']) => {
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

  render(<form.Form conf={form_test_conf} onState={on_state} onSubmit={on_submit}/>)

  expect(ref.prev).toBeUndefined()
  expect(ref.now).not.toBeUndefined()
  expect(ref.diff).toStrictEqual(ref.now)

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

test('can reset', async () => {
  const ref = setup()

  fireEvent.click(screen.getByLabelText('N0'))
  expect(ref.diff).toStrictEqual({'pN_stage': ['N1', 'N2']})

  fireEvent.click(screen.getByText(/reset/i))
  expect(ref.diff).toStrictEqual({'pN_stage': ['N0', 'N1', 'N2']})
})

test('can submit', async () => {
  let calls = 0

  setup((...xs) => {
    expect(xs).toHaveLength(1)
    expect(xs[0]).toHaveProperty('facet', 'cell')
    calls += 1
  })

  fireEvent.click(screen.getByText(/plot/i))

  expect(calls).toBe(1)
})

test('can select up to 3 tumor types', async () => {
  const ref = setup()

  // Clicking the label on the autocomplete does not open it,
  // so we have to find the open button (downwards facing triangle in the ui)

  const label_parent = screen.getByLabelText(/Tumor types/).parentElement as HTMLElement
  expect(label_parent).not.toBeNull()

  fireEvent.click(within(label_parent).getByLabelText(/Open/))
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

test('can change to cell types', async () => {
  const ref = setup()

  const label_parent = screen.getByLabelText(/Cell types/).parentElement as HTMLElement
  expect(label_parent).not.toBeNull()

  fireEvent.click(within(label_parent).getByLabelText(/Open/))
  expect(ref.prev).toBeUndefined()

  fireEvent.click(screen.getByLabelText('CD4'))
  expect(ref.diff).toStrictEqual({
    tumors: form_test_conf.tumors,
    cells: ['CD4'],
    facet: 'tumor',
  })

  fireEvent.click(screen.getByLabelText('CD4 Treg'))
  expect(ref.diff).toStrictEqual({ cells: ['CD4', 'CD4_Treg'], })

  fireEvent.click(screen.getByLabelText('CD8'))
  expect(ref.diff).toStrictEqual({ cells: ['CD4', 'CD4_Treg', 'CD8'], })

  fireEvent.click(screen.getByLabelText('CD8 Treg'))
  expect(ref.diff).toStrictEqual({ cells: ['CD4_Treg', 'CD8', 'CD8_Treg'], })

  fireEvent.click(screen.getByLabelText('CD8'))
  expect(ref.diff).toStrictEqual({ cells: ['CD4_Treg', 'CD8_Treg'], })
})

test('can access specific tumor filters when tumor selected', async () => {
  const ref = setup()

  const label_parent = screen.getByLabelText(/Tumor types/).parentElement as HTMLElement
  expect(label_parent).not.toBeNull()

  fireEvent.click(within(label_parent).getByLabelText(/Open/))
  expect(ref.prev).toBeUndefined()

  fireEvent.click(screen.getByLabelText('COAD'))
  expect(ref.diff).toStrictEqual({tumors: ['BRCA', 'COAD']})

  expect(screen.queryAllByLabelText(/Anatomical/)).toHaveLength(1)
  expect(screen.queryAllByLabelText(/MSI/)).toHaveLength(0)

  fireEvent.click(screen.getByLabelText('READ'))
  expect(ref.diff).toStrictEqual({tumors: ['BRCA', 'COAD', 'READ']})

  expect(screen.queryAllByLabelText(/Anatomical/)).toHaveLength(2)
  expect(screen.queryAllByLabelText(/MSI/)).toHaveLength(1)

  {
    const label_parent = screen.getByLabelText(/MSI/).parentElement as HTMLElement
    expect(label_parent).not.toBeNull()

    fireEvent.click(within(label_parent).getByLabelText(/Open/))
  }

  fireEvent.click(screen.getByLabelText('MSS'))
  expect(ref.diff).toStrictEqual({MSI_ARTUR: {READ: ['MSI']}})

  fireEvent.click(screen.getByLabelText('MSS'))
  expect(ref.diff).toStrictEqual({MSI_ARTUR: {READ: ['MSI', 'MSS']}})

  fireEvent.click(screen.getByLabelText('MSI'))
  expect(ref.diff).toStrictEqual({MSI_ARTUR: {READ: ['MSS']}})

  fireEvent.click(screen.getByLabelText('MSS'))
  expect(ref.diff).toStrictEqual({MSI_ARTUR: {READ: []}})

  expect(screen.queryAllByText(/need at least one/i)).toHaveLength(1)
})

test('can access specific tumor filters when cells selected', async () => {
  const ref = setup()

  const label_parent = screen.getByLabelText(/Cell types/).parentElement as HTMLElement
  expect(label_parent).not.toBeNull()

  fireEvent.click(within(label_parent).getByLabelText(/Open/))
  expect(ref.prev).toBeUndefined()

  fireEvent.click(screen.getByLabelText('CD4'))
  expect(ref.diff).toHaveProperty('cells', ['CD4'])

  expect(screen.queryAllByLabelText(/Anatomical/)).toHaveLength(2)
  expect(screen.queryAllByLabelText(/MSI/)).toHaveLength(1)

  {
    const label_parent = screen.getByLabelText(/MSI/).parentElement as HTMLElement
    expect(label_parent).not.toBeNull()

    fireEvent.click(within(label_parent).getByLabelText(/Open/))
  }

  fireEvent.click(screen.getByLabelText('MSS'))
  expect(ref.diff).toStrictEqual({MSI_ARTUR: {READ: ['MSI']}})

  fireEvent.click(screen.getByLabelText('MSS'))
  expect(ref.diff).toStrictEqual({MSI_ARTUR: {READ: ['MSI', 'MSS']}})

  fireEvent.click(screen.getByLabelText('MSI'))
  expect(ref.diff).toStrictEqual({MSI_ARTUR: {READ: ['MSS']}})

  fireEvent.click(screen.getByLabelText('MSS'))
  expect(ref.diff).toStrictEqual({MSI_ARTUR: {READ: []}})

  expect(screen.queryAllByText(/need at least one/i)).toHaveLength(1)
})
