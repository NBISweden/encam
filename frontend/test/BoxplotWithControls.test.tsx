import * as React from 'react'

import {BoxplotWithControls} from '../src/BoxplotWithControls'

import * as boxplot_data from '../src/data/boxplot'

import {act, render, fireEvent, screen, waitFor} from '@testing-library/react'
import * as q from '@testing-library/react'

const {click, doubleClick} = fireEvent
const {getByLabelText} = screen

async function wait_for_visualization() {
  return await waitFor(() => getByLabelText('Vega visualization'))
}

test('can change visible cells', async () => {
  jest.useFakeTimers()
  render(<BoxplotWithControls data={boxplot_data.rows} facet="cell" />)

  async function axis_titles() {
    const svg = await wait_for_visualization()
    const titles = q.queryAllByLabelText(svg, /Title text/)
    return titles.map(t => t.textContent)
  }

  expect(await axis_titles()).toEqual(['CD4', 'CD4_Treg', 'CD8'])

  click(getByLabelText('CD4'))
  expect(await axis_titles()).toEqual(['CD4', 'CD4_Treg', 'CD8'])
  act(() => {
    jest.runAllTimers()
  })
  expect(await axis_titles()).toEqual(['CD4_Treg', 'CD8'])

  doubleClick(getByLabelText('CD4'))
  expect(await axis_titles()).toEqual(['CD4_Treg', 'CD8'])
  act(() => {
    jest.runAllTimers()
  })
  expect(await axis_titles()).toEqual(['CD4'])

  doubleClick(getByLabelText('CD4'))
  expect(await axis_titles()).toEqual(['CD4'])
  act(() => {
    jest.runAllTimers()
  })
  expect(await axis_titles()).toEqual(['CD4', 'CD4_Treg', 'CD8'])
})

test('visible cells can be hidden', async () => {
  const BP = render(<BoxplotWithControls data={boxplot_data.rows} facet="cell" />)

  expect(getByLabelText('CD4')).toBeTruthy()

  const expand_less = BP.getByText(/visible cells/)

  click(expand_less)

  expect(screen.queryByLabelText('CD4')).toBeFalsy()

  click(expand_less)

  expect(getByLabelText('CD4')).toBeTruthy()
})

test('can change range', async () => {
  render(<BoxplotWithControls data={boxplot_data.rows} facet="cell" />)

  await wait_for_visualization()

  expect(screen.getByText('550')).toBeTruthy()

  click(getByLabelText(/min-max/))

  await wait_for_visualization()

  expect(screen.getByText('3,000')).toBeTruthy()

  click(getByLabelText(/default/))

  await wait_for_visualization()

  expect(screen.getByText('550')).toBeTruthy()
})
