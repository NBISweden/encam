import * as React from 'react'

import {Splash} from '../src/Splash'

import * as splash_test_data from '../src/data/splash'

import {render, fireEvent, screen, waitFor} from '@testing-library/react'

import {MockBackend} from '../src/backend'

const {click} = fireEvent

const MockSplash = () => (
  <MockBackend request={splash_test_data.request}>
    <Splash />
  </MockBackend>
)

describe(Splash, () => {
  test('draws plots and one tumor type at a time can be selected', async () => {
    render(<MockSplash />)

    await waitFor(() => screen.queryAllByText(/BRCA/))

    expect(screen.queryAllByText('CD4')).toHaveLength(4)
    expect(screen.queryAllByText('NKT')).toHaveLength(1)
    expect(screen.queryAllByText('BRCA')).toHaveLength(2)

    click(screen.getByLabelText(/BRCA/))

    await waitFor(() => {
      expect(screen.queryAllByText(/NKT/)).toHaveLength(3)
    })

    expect(screen.queryAllByText('NKT')).toHaveLength(3)

    expect(screen.queryAllByText(/READ/)).toHaveLength(1)

    click(screen.getByLabelText(/READ/))

    await waitFor(() => {
      expect(screen.queryAllByText(/READ/)).toHaveLength(2)
    })

    expect(screen.queryAllByText('NKT')).toHaveLength(3)
  })

  test('draws plots and up to three cell types can be selected', async () => {
    render(<MockSplash />)

    await waitFor(() => screen.queryAllByText(/BRCA/))

    expect(screen.queryAllByText('CD4')).toHaveLength(4)
    expect(screen.queryAllByText('NKT')).toHaveLength(1)
    expect(screen.queryAllByText('BRCA')).toHaveLength(2)

    click(screen.getByLabelText('CD4 Treg'))

    // CD4, CD4_Treg
    await waitFor(() => {
      expect(screen.queryAllByText('CD4 Treg')).toHaveLength(4)
    })
    expect(screen.queryAllByText('CD4')).toHaveLength(4)
    expect(screen.queryAllByText('NKT')).toHaveLength(1)
    expect(screen.queryAllByText('BRCA')).toHaveLength(3)

    click(screen.getByLabelText('NK'))

    // CD4, CD4_Treg, NK
    await waitFor(() => {
      expect(screen.queryAllByText('NK')).toHaveLength(4)
    })
    expect(screen.queryAllByText('CD4')).toHaveLength(4)
    expect(screen.queryAllByText('CD4 Treg')).toHaveLength(4)
    expect(screen.queryAllByText('NKT')).toHaveLength(1)
    expect(screen.queryAllByText('BRCA')).toHaveLength(4)

    click(screen.getByLabelText('NKT'))

    // CD4_Treg, NK, NKT
    await waitFor(() => {
      expect(screen.queryAllByText('NKT')).toHaveLength(4)
    })
    expect(screen.queryAllByText('CD4 Treg')).toHaveLength(4)
    expect(screen.queryAllByText('NK')).toHaveLength(4)
    expect(screen.queryAllByText('CD4')).toHaveLength(1)
    expect(screen.queryAllByText('BRCA')).toHaveLength(4)

    click(screen.getByLabelText('NK'))

    // CD4_Treg, NKT
    await waitFor(() => {
      expect(screen.queryAllByText('NK')).toHaveLength(1)
    })
    expect(screen.queryAllByText('CD4 Treg')).toHaveLength(4)
    expect(screen.queryAllByText('NKT')).toHaveLength(4)
    expect(screen.queryAllByText('CD4')).toHaveLength(1)
    expect(screen.queryAllByText('BRCA')).toHaveLength(3)
  })
})
