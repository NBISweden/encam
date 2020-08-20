import * as React from 'react'

import {FormAndKMPlot} from '../src/FormAndPlot'

import * as km_data from '../src/data/kmplot'

import {MockBackend} from '../src/backend'

import {form_test_conf} from '../src/data/form'

import {render, act, fireEvent, screen, waitFor} from '@testing-library/react'

const {click} = fireEvent

describe(FormAndKMPlot, () => {
  test('pressing plot calls backend and makes a plot', async () => {
    jest.useFakeTimers()

    let calls = 0

    const request = async (endpoint: string, body: any) => {
      calls++
      if (endpoint == 'configuration') {
        expect(body).toBeUndefined()
        return form_test_conf
      } else if (endpoint == 'expression') {
        expect(body).toBeDefined()
        return km_data.expression
      } else if (endpoint == 'survival') {
        expect(body).toBeDefined()
        return km_data.survival
      } else {
        throw new Error(`Unsupported endpoint ${endpoint}`)
      }
    }

    render(
      <MockBackend request={request}>
        <FormAndKMPlot />
      </MockBackend>
    )

    await waitFor(() => screen.getByText(/plot/i))

    expect(calls).toBe(1)

    click(screen.getByText(/plot/i))

    await waitFor(() => screen.getByText(/cell density/i))

    expect(calls).toBe(2)

    screen.getByRole('progressbar')

    expect(calls).toBe(2)

    act(() => {
      jest.runAllTimers()
    })

    expect(calls).toBe(3)

    screen.getByRole('progressbar')

    act(() => {
      jest.runAllTimers()
    })

    await waitFor(() => {
      if (screen.queryAllByRole('progressbar').length) {
        throw new Error('still waiting')
      }
    })

    await waitFor(() => {
      screen.getByText(/probability/i)
    })

    // expect(calls).toBe(3)
  })
})
