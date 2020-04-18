import * as React from 'react'

import {css, div, clear as clear_css} from './css'

interface Conf {
  variant_values: {
    column: string,
    values: string[],
  }[],
  tumor_specific_values: {
    column: string,
    tumor: string,
    values: string[],
  }[],
  cell_types_full: string[],
  cell_types: string[]
}

declare const require: (path: string) => Conf

const conf = require('./form_configuration.json')

console.log(conf)

export function Form() {
  return div(
    css`display: flex; flex-direction: column`,
    conf.tumor_specific_values.map(row =>
      div(
        css`display: flex; flex-direction: row`,
        div(row.column + '=' + row.tumor, css`width: 200px; flex-grow: 0; flex-shrink: 0; padding: 10; border: 1px black solid`),
        div(
          css`flex-grow: 1`,
          css`display: flex; flex-direction: row; flex-wrap: wrap`,
          css`& > div { border: 1px black solid; padding: 10; flex-grow: 1; flex-shrink: 0; flex-basis: 0; display: flex }`,
          css`& > div > span { margin: auto }`,
          ...row.values.map(value => div(<label><input type="checkbox"/>{value}</label>)),
        ),
      )
    ),
    conf.variant_values.map(row =>
      div(
        css`display: flex; flex-direction: row`,
        div(row.column, css`width: 200px; flex-grow: 0; flex-shrink: 0; padding: 10; border: 1px black solid`),
        div(
          css`flex-grow: 1`,
          css`display: flex; flex-direction: row; flex-wrap: wrap`,
          css`& > div { border: 1px black solid; padding: 10; flex-grow: 1; flex-shrink: 0; flex-basis: 0; display: flex }`,
          css`& > div > span { margin: auto }`,
          ...row.values.map(value => div(<span>{value}</span>)),
        ),
      )
    ),
  )
}
