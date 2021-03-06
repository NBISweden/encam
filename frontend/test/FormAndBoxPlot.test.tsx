import * as React from 'react'

import {FormAndBoxPlot} from '../src/FormAndPlot'

import {MockBackend} from '../src/backend'

import {form_test_conf} from '../src/data/form'
import {grouped_rows} from '../src/data/boxplot'

import {render, fireEvent, screen, waitFor} from '@testing-library/react'

const {click} = fireEvent
const {getByLabelText} = screen

describe(FormAndBoxPlot, () => {
  test('pressing plot calls backend and makes a plot', async () => {
    let calls = 0

    const request = async (endpoint: string, body: any) => {
      calls++
      if (endpoint == 'configuration') {
        expect(body).toBeUndefined()
        return form_test_conf
      } else if (endpoint == 'tukey') {
        expect(body).toBeDefined()
        return grouped_rows
      }
      throw new Error(`Unsupported endpoint ${endpoint}`)
    }

    render(
      <MockBackend request={request}>
        <FormAndBoxPlot />
      </MockBackend>
    )

    await waitFor(() => screen.getByText(/plot/i))

    expect(calls).toBe(1)

    click(screen.getByText(/plot/i))

    await waitFor(() => getByLabelText('Vega visualization'))

    expect(calls).toBe(2)
  })
})
