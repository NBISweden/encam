
import * as React from 'react'
import {Boxplot} from './boxplots'

import {boxplot_data} from './boxplot_data'

import {render, fireEvent, screen, waitFor} from '@testing-library/react'
import * as q from '@testing-library/react'

test('can change visible cells', async () => {
  render(<Boxplot data={boxplot_data} facet="cell"/>)

  async function axis_titles() {
    const svg = await waitFor(() => screen.getByLabelText('Vega visualization'))
    const titles = q.queryAllByLabelText(svg, /Title text/)
    return titles.map(t => t.textContent)
  }

  expect(await axis_titles()).toEqual('CD4 CD4_Treg CD8'.split(/ /))

  const CD4 = screen.getByLabelText('CD4')

  fireEvent.click(CD4)
  expect(await axis_titles()).toEqual('CD4_Treg CD8'.split(/ /))

  fireEvent.click(CD4, {ctrlKey: true})
  expect(await axis_titles()).toEqual('CD4'.split(/ /))

  fireEvent.click(CD4, {ctrlKey: true})
  expect(await axis_titles()).toEqual('CD4 CD4_Treg CD8'.split(/ /))
})

test('visible cells can be hidden', async () => {
  const BP = render(<Boxplot data={boxplot_data} facet="cell"/>)

  expect(screen.getByLabelText('CD4')).toBeTruthy()

  const expand_less = BP.getByText(/visible cells/)

  fireEvent.click(expand_less)

  expect(screen.queryByLabelText('CD4')).toBeFalsy()

  expect(screen.queryByText(/visible cells/)).toBeFalsy()
  fireEvent.click(expand_less)

  expect(screen.getByLabelText('CD4')).toBeTruthy()
  expect(screen.queryByText(/visible cells/)).toBeTruthy()
})



