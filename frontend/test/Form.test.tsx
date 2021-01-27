import * as React from 'react'
import * as form from '../src/Form'

import * as utils from '../src/utils'

import {form_test_conf} from '../src/data/form'

import {within, render, fireEvent, screen} from '@testing-library/react'
import * as q from '@testing-library/react'

const {click} = fireEvent
const {getByLabelText} = screen

type State = Record<string, any>

function make_setup(Form: typeof form.Form, N: number) {
  return function setup(on_submit?: form.FormProps['onSubmit']) {
    let refs = utils.enumTo(N).map(() => ({
      prev: undefined as State | undefined,
      now: undefined as State | undefined,
      diff: undefined as Partial<State> | undefined,
    }))

    const on_state = (...xs: State[]) => {
      expect(xs).toHaveLength(N)
      refs.forEach((ref, i) => {
        const s = {...xs[i]}
        ref.prev = ref.now && {...ref.now}
        ref.now = s
        ref.diff = utils.simple_object_diff(ref.prev || {}, ref.now)
      })
    }

    render(<Form conf={form_test_conf} onState={on_state} onSubmit={on_submit} />)

    refs.forEach(ref => {
      expect(ref.now).not.toBeUndefined()
    })

    return refs
  }
}

function click_autocomplete(label_matcher: q.Matcher): void {
  // Clicking the label on the autocomplete does not open it,
  // so we have to find the open button (downwards facing triangle in the ui)

  const label_parent = getByLabelText(label_matcher).parentElement as HTMLElement
  expect(label_parent).not.toBeNull()

  click(within(label_parent).getByLabelText(/Open/))
}

describe(form.Form, () => {
  const setup = make_setup(form.Form, 1)

  test('can submit', async () => {
    let calls = 0

    setup((...xs) => {
      expect(xs).toHaveLength(1)
      expect(xs[0]).toHaveProperty('facet', 'cell')
      calls += 1
    })

    click(screen.getByText(/plot/i))

    expect(calls).toBe(1)
  })

  test('can reset', async () => {
    const [ref] = setup()

    const init = utils.copy(ref.now)

    click(getByLabelText('N0'))
    expect(ref.diff).toStrictEqual({pN_stage: ['N1', 'N2']})

    click(screen.getByText(/reset/i))
    expect(ref.now).toStrictEqual(init)
  })

  test('can select and deselect options', async () => {
    const [ref] = setup()

    click(getByLabelText('low'))
    expect(ref.diff).toStrictEqual({Diff_grade: ['high', 'missing']})

    click(getByLabelText('high'))
    expect(ref.diff).toStrictEqual({Diff_grade: ['missing']})

    click(screen.getAllByLabelText('missing')[0])
    // wrap-around removed, no change
    // expect(ref.diff).toStrictEqual({Diff_grade: ['high', 'low']})
    expect(ref.diff).toStrictEqual({})

    click(screen.getAllByLabelText('missing')[1])
    expect(ref.diff).toStrictEqual({Neuralinv: ['No', 'Yes']})

    click(screen.getAllByLabelText('missing')[0])
    // expect(ref.diff).toStrictEqual({Diff_grade: ['high', 'low', 'missing']})
    expect(ref.diff).toStrictEqual({})
  })

  test('can select up to 3 tumor types', async () => {
    const [ref] = setup()

    click_autocomplete(/Tumor types/)

    click(getByLabelText('COAD'))
    expect(ref.diff).toStrictEqual({tumors: ['BRCA', 'COAD']})

    click(getByLabelText('READ'))
    expect(ref.diff).toStrictEqual({tumors: ['BRCA', 'COAD', 'READ']})
    click(getByLabelText('MEL'))
    expect(ref.diff).toStrictEqual({tumors: ['COAD', 'READ', 'MEL']})

    click(getByLabelText('MEL'))
    expect(ref.diff).toStrictEqual({tumors: ['COAD', 'READ']})

    click(getByLabelText('BRCA'))
    expect(ref.diff).toStrictEqual({tumors: ['COAD', 'READ', 'BRCA']})
  })

  test('can change to cell types', async () => {
    const [ref] = setup()

    click(getByLabelText('cells'))

    expect(ref.now!.tumors).toStrictEqual(form_test_conf.tumors)
    expect(ref.now!.cells).toStrictEqual(['CD4'])
    expect(ref.now!.facet).toStrictEqual('tumor')

    click_autocomplete(/Cell types/)

    click(getByLabelText('CD4 Treg'))
    expect(ref.diff).toStrictEqual({cells: ['CD4', 'CD4_Treg']})

    click(getByLabelText('CD8'))
    expect(ref.diff).toStrictEqual({cells: ['CD4', 'CD4_Treg', 'CD8']})

    click(getByLabelText('CD8 Treg'))
    expect(ref.diff).toStrictEqual({cells: ['CD4_Treg', 'CD8', 'CD8_Treg']})

    click(getByLabelText('CD8'))
    expect(ref.diff).toStrictEqual({cells: ['CD4_Treg', 'CD8_Treg']})
  })

  test('can access specific tumor filters when tumor selected', async () => {
    const [ref] = setup()

    click_autocomplete(/Tumor types/)

    expect(screen.queryAllByText(/Appendix/)).toHaveLength(0)
    expect(screen.queryAllByText(/Ascendens/)).toHaveLength(0)

    expect(screen.queryAllByText(/no options/i)).toHaveLength(2)

    click(getByLabelText('COAD'))

    expect(ref.diff).toStrictEqual({tumors: ['BRCA', 'COAD']})

    expect(screen.queryAllByText(/Appendix/)).toHaveLength(1)
    expect(screen.queryAllByText(/Ascendens/)).toHaveLength(1)

    expect(screen.queryAllByText(/no options\)/i)).toHaveLength(1)
    expect(screen.queryAllByText(/1 option\)/i)).toHaveLength(1)

    click(getByLabelText('READ'))
    expect(ref.diff).toStrictEqual({tumors: ['BRCA', 'COAD', 'READ']})

    expect(screen.queryAllByText(/Appendix/)).toHaveLength(2)
    expect(screen.queryAllByText(/Ascendens/)).toHaveLength(1)

    expect(screen.queryAllByText(/2 options\)/i)).toHaveLength(1)
    expect(screen.queryAllByText(/1 option\)/i)).toHaveLength(1)

    click(getByLabelText('MSS'))
    expect(ref.diff).toStrictEqual({MSI_ARTUR: {READ: ['MSI']}})

    expect(screen.queryAllByText(/1 option\)/i)).toHaveLength(0)
    expect(screen.queryAllByText(/1 option, edited\)/i)).toHaveLength(1)

    click(getByLabelText('MSS'))
    expect(ref.diff).toStrictEqual({MSI_ARTUR: {READ: ['MSI', 'MSS']}})

    click(getByLabelText('MSI'))
    expect(ref.diff).toStrictEqual({MSI_ARTUR: {READ: ['MSS']}})

    click(getByLabelText('MSS'))
    expect(ref.diff).toStrictEqual({})
  })

  test('can access specific tumor filters when cells selected', async () => {
    const [ref] = setup()

    click(getByLabelText('cells'))
    click_autocomplete(/Cell types/)

    expect(ref.diff).toHaveProperty('cells', ['CD4'])

    expect(screen.queryAllByText(/Appendix/)).toHaveLength(2)
    expect(screen.queryAllByText(/Ascendens/)).toHaveLength(1)

    expect(screen.queryAllByText(/no options\)/i)).toHaveLength(0)
    expect(screen.queryAllByText(/1 option\)/i)).toHaveLength(1)
    expect(screen.queryAllByText(/2 options\)/i)).toHaveLength(1)

    click(screen.getAllByLabelText('Appendix')[0])
    expect(ref.diff).toStrictEqual({
      Anatomical_location: {
        COAD: ['Ascendens', 'Descendens', 'Rectum'],
        READ: ['Appendix', 'Rectum'],
      },
    })

    expect(screen.queryAllByText(/2 options\)/i)).toHaveLength(0)
    expect(screen.queryAllByText(/2 options, edited\)/i)).toHaveLength(1)

    click(screen.getAllByLabelText('Appendix')[1])
    expect(ref.diff).toStrictEqual({
      Anatomical_location: {COAD: ['Ascendens', 'Descendens', 'Rectum'], READ: ['Rectum']},
    })

    expect(screen.queryAllByText(/2 options\)/i)).toHaveLength(0)
    expect(screen.queryAllByText(/2 options, edited\)/i)).toHaveLength(1)
  })
})

describe(form.TwoForms, () => {
  const setup = make_setup(form.TwoForms, 2)

  test('can submit', async () => {
    let calls = 0

    setup((...xs) => {
      expect(xs).toHaveLength(2)
      expect(xs[0]).toHaveProperty('facet', 'cell')
      expect(xs[1]).toHaveProperty('facet', 'cell')
      calls += 1
    })

    click(screen.getByText(/plot/i))

    expect(calls).toBe(1)
  })

  test('can reset', async () => {
    const [a, b] = setup()

    const init = utils.copy({a, b})

    click(screen.getAllByLabelText('high')[0])
    expect(a.diff).toStrictEqual({Diff_grade: ['low', 'missing']})
    expect(b.diff).toStrictEqual({})

    click(screen.getAllByLabelText('low')[1])
    expect(a.diff).toStrictEqual({})
    expect(b.diff).toStrictEqual({Diff_grade: ['high', 'missing']})

    click(screen.getByText(/reset/i))
    expect(a.now).toStrictEqual(init.a.now)
    expect(b.now).toStrictEqual(init.b.now)
  })
})
