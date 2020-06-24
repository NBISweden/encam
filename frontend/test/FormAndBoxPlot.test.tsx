
import * as React from 'react'

import {FormAndBoxPlot} from '../src/FormAndBoxPlot'

import {MockBackend} from '../src/backend'

import {form_test_conf} from './data/form'
import {boxplot_test_data_grouped} from './data/boxplot'

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
        return boxplot_test_data_grouped
      }
      throw new Error(`Unsupported endpoint ${endpoint}`)
    }

    render(
      <MockBackend request={request}>
        <FormAndBoxPlot/>
      </MockBackend>
    )

    await waitFor(() => screen.getByText(/plot/i))

    expect(calls).toBe(1)

    click(screen.getByText(/plot/i))

    await waitFor(() => getByLabelText('Vega visualization'))

    expect(calls).toBe(2)
  })
})

