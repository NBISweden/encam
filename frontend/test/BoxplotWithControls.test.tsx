import * as React from 'react'
import {BoxplotWithControls} from '../src/BoxplotWithControls'

import {boxplot_test_data} from './data/boxplot'

import {render, fireEvent, screen, waitFor} from '@testing-library/react'
import * as q from '@testing-library/react'

const {click} = fireEvent
const {getByLabelText} = screen

async function wait_for_visualization() {
  return await waitFor(() => getByLabelText('Vega visualization'))
}

test('can change visible cells', async () => {
  render(<BoxplotWithControls data={boxplot_test_data} facet="cell" />)

  async function axis_titles() {
    const svg = await wait_for_visualization()
    const titles = q.queryAllByLabelText(svg, /Title text/)
    return titles.map(t => t.textContent)
  }

  expect(await axis_titles()).toEqual(['CD4', 'CD4_Treg', 'CD8'])

  click(getByLabelText('CD4'))
  expect(await axis_titles()).toEqual(['CD4_Treg', 'CD8'])

  click(getByLabelText('CD4'), {ctrlKey: true})
  expect(await axis_titles()).toEqual(['CD4'])

  click(getByLabelText('CD4'), {ctrlKey: true})
  expect(await axis_titles()).toEqual(['CD4', 'CD4_Treg', 'CD8'])
})

test('visible cells can be hidden', async () => {
  const BP = render(<BoxplotWithControls data={boxplot_test_data} facet="cell" />)

  expect(getByLabelText('CD4')).toBeTruthy()

  const expand_less = BP.getByText(/visible cells/)

  click(expand_less)

  expect(screen.queryByLabelText('CD4')).toBeFalsy()

  expect(screen.queryByText(/visible cells/)).toBeFalsy()
  click(expand_less)

  expect(getByLabelText('CD4')).toBeTruthy()
  expect(screen.queryByText(/visible cells/)).toBeTruthy()
})

test('can change range', async () => {
  render(<BoxplotWithControls data={boxplot_test_data} facet="cell" />)

  await wait_for_visualization()

  expect(screen.getByText('550')).toBeTruthy()

  click(getByLabelText(/min-max/))

  await wait_for_visualization()

  expect(screen.getByText('3,000')).toBeTruthy()

  click(getByLabelText(/default/))

  await wait_for_visualization()

  expect(screen.getByText('550')).toBeTruthy()
})
