
import * as React from 'react'

import {FormAndPlot} from './form_and_plot'

import {make_backend} from './backend'

import {form_test_conf} from './form_test_data'
import {boxplot_test_data_grouped} from './boxplot_test_data'

import {render, fireEvent, screen, waitFor} from '@testing-library/react'

const {click} = fireEvent
const {getByLabelText} = screen

describe(FormAndPlot, () => {
  test('pressing plot calls backend and makes a plot', async () => {
    let calls = 0

    const backend = make_backend(async (endpoint, body) => {
      calls++
      if (endpoint == 'configuration') {
        expect(body).toBeUndefined()
        return form_test_conf
      } else if (endpoint == 'tukey') {
        expect(body).toBeDefined()
        return boxplot_test_data_grouped
      }
      throw new Error(`Unsupported endpoint ${endpoint}`)
    })

    render(<FormAndPlot backend={backend}/>)

    await waitFor(() => screen.getByText(/plot/i))

    expect(calls).toBe(1)

    click(screen.getByText(/plot/i))

    await waitFor(() => getByLabelText('Vega visualization'))

    expect(calls).toBe(2)
  })
})

