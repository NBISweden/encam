import * as React from 'react'
import {div, css} from '../src/ui_utils'
import {render, fireEvent, screen} from '@testing-library/react'
// import serializer from 'jest-emotion'
import renderer from 'react-test-renderer'
// import styled from '@emotion/styled'

// expect.addSnapshotSerializer(serializer)

describe('div, css', () => {
  test('strings', async () => {
    const el = render(div('hell', 'o'))
    expect(el.container.innerHTML).toMatchInlineSnapshot(`"<div>hello</div>"`)
  })

  test('elements', async () => {
    const el = render(div(<b>X</b>, <i>Y</i>))
    expect(el.container.innerHTML).toMatchInlineSnapshot(`"<div><b>X</b><i>Y</i></div>"`)
  })

  test('children', async () => {
    const el = render(div({children: [<b>X</b>, <i>Y</i>]}))
    expect(el.container.innerHTML).toMatchInlineSnapshot(`"<div><b>X</b><i>Y</i></div>"`)
  })

  test('nested', async () => {
    const el = render(div([['hell'], <i>o</i>, ['!']]))
    expect(el.container.innerHTML).toMatchInlineSnapshot(`"<div>hell<i>o</i>!</div>"`)
  })

  test('className', async () => {
    const el = render(div({className: 'bepa'}, {className: 'cepa'}))
    expect(el.container.innerHTML).toMatchInlineSnapshot(`"<div class=\\"bepa cepa\\"></div>"`)
  })

  test('css', async () => {
    const node = div(
      'x',
      css`
        color: ${'red'};
      `,
      css(`background: blue;`),
      css({display: 'inline'})
    )
    expect(renderer.create(node).toJSON()).toMatchInlineSnapshot(`
      .emotion-0 {
        color: red;
        background: blue;
        display: inline;
      }

      <div
        className="emotion-0"
      >
        x
      </div>
    `)
  })

  test('styles', async () => {
    const el = render(div({style: {color: 'red', background: 'green'}}, {style: {color: 'blue'}}))
    expect(el.container.innerHTML).toMatchInlineSnapshot(
      `"<div style=\\"color: blue; background: green;\\"></div>"`
    )
  })

  test('nils', async () => {
    const el = render(div(true, false, null, undefined))
    expect(el.container.innerHTML).toMatchInlineSnapshot(`"<div></div>"`)
  })

  test('onClicks', async () => {
    const msgs: string[] = []
    const el = render(
      div(
        'hit me',
        {onClick: e => msgs.push('one:', ((e.target as any) as HTMLDivElement).textContent + '')},
        {onClick: e => msgs.push('two:', ((e.target as any) as HTMLDivElement).textContent + '')}
      )
    )
    fireEvent.click(screen.getByText('hit me'))
    expect(msgs).toStrictEqual(['one:', 'hit me', 'two:', 'hit me'])
    expect(el.container.innerHTML).toMatchInlineSnapshot(`"<div>hit me</div>"`)
  })
})
