import * as React from 'react'
import {div, css} from '../src/ui_utils'
import * as ui from '../src/ui_utils'
import {render, fireEvent, screen, waitFor} from '@testing-library/react'

const str = (s: TemplateStringsArray) => JSON.stringify(s[0])

describe('div, css', () => {
  test('strings', async () => {
    const el = render(div('hell', 'o'))
    expect(el.container.innerHTML).toMatchInlineSnapshot(str`<div class="sc-AxirZ ktnnZK">hello</div>`)
  })

  test('elements', async () => {
    const el = render(div(<b>X</b>, <i>Y</i>))
    expect(el.container.innerHTML).toMatchInlineSnapshot(str`<div class="sc-AxirZ ktnnZK"><b>X</b><i>Y</i></div>`)
  })

  test('children', async () => {
    const el = render(div({children: [<b>X</b>, <i>Y</i>]}))
    expect(el.container.innerHTML).toMatchInlineSnapshot(str`<div class="sc-AxirZ ktnnZK"><b>X</b><i>Y</i></div>`)
  })

  test('nested', async () => {
    const el = render(div([['hell'], <i>o</i>, ['!']]))
    expect(el.container.innerHTML).toMatchInlineSnapshot(str`<div class="sc-AxirZ ktnnZK">hell<i>o</i>!</div>`)
  })

  test('className', async () => {
    const el = render(div({className: "bepa"}, {className: "cepa"}))
    expect(el.container.innerHTML).toMatchInlineSnapshot(str`<div class="sc-AxirZ ktnnZK bepa cepa"></div>`)
  })

  test('css', async () => {
    const el = render(div('x', css`color: ${"red"}`, css(`background: blue`)))
    expect(el.container.innerHTML).toMatchInlineSnapshot(str`<div class="sc-AxirZ bNsHlc">x</div>`)
  })

  test('styles', async () => {
    const el = render(div({style: {color: 'red', background: 'green'}}, {style: {color: 'blue'}}))
    expect(el.container.innerHTML).toMatchInlineSnapshot(str`<div style="color: blue; background: green;" class="sc-AxirZ ktnnZK"></div>`)
  })

  test('nils', async () => {
    const el = render(div(true, false, null, undefined))
    expect(el.container.innerHTML).toMatchInlineSnapshot(str`<div class="sc-AxirZ ktnnZK"></div>`)
  })

  test('onClicks', async () => {
    const msgs: string[] = []
    const el = render(div(
      'hit me',
      {onClick: e => msgs.push('one:', (e.target as any as HTMLDivElement).textContent + '')},
      {onClick: e => msgs.push('two:', (e.target as any as HTMLDivElement).textContent + '')},
    ))
    fireEvent.click(screen.getByText('hit me'))
    expect(msgs).toStrictEqual([
      'one:', 'hit me',
      'two:', 'hit me',
    ])
    expect(el.container.innerHTML).toMatchInlineSnapshot(str`<div class="sc-AxirZ ktnnZK">hit me</div>`)
  })
})
