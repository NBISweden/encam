import * as React from 'react'
import {css} from 'emotion'

import * as ui from './ui_utils'
import * as utils from './utils'
import {cell_color} from './cell_colors'

const infoButton = css`
  border: none;
  margin: 0;
  background: none;
  padding: 0;
  &:focus {
    outline: none;
  }
  cursor: pointer;
  z-index: 2;
`

const info = css`
  position: relative;
  & > .info-area {
    color: #000;

    position: absolute;
    left: calc(100% + 5px);
    top: calc(50% - 20px);
    z-index: 3;
    background: #fff;
    user-select: text;
    border-radius: 4px;
    padding: 8px;
    min-height: 42px;
    min-width: 66px;

    width: 400px;

    &::before {
      position: absolute;
      left: -7px;
      top: 13px;
      transform: rotate(45deg);
      width: 13px;
      height: 13px;
      background: #fff;
      z-index: -1;
      content: '';
      border-left: 1px black solid;
      border-bottom: 1px black solid;
      box-shadow: 2px 4px 4px -4px #333;
    }
    border: 1px black solid;
    box-shadow: 2px 4px 4px -4px #333;
  }

  & > .click-away {
    position: fixed;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    z-index: 1;
    cursor: pointer;
  }
`

import InfoIcon from '@material-ui/icons/Info'

const useGlobalState = ui.createGlobalState(0)

export function Info(props: {children?: React.ReactNode}) {
  const [num_leader, set_num_leader] = useGlobalState()
  const [num_enter, set_num_enter] = React.useState(0)
  const [num_leave, set_num_leave] = React.useState(0)
  const [over_info, set_over_info] = React.useState(false)
  const [clicked, set_clicked] = React.useState(false)
  const show = ((num_enter > num_leave || over_info) && num_enter >= num_leader) || clicked
  return (
    <div className={info}>
      <button
        className={infoButton}
        aria-label="info"
        onMouseEnter={() => {
          set_num_enter(num_leader + 1)
          set_num_leader(num_leader + 1)
        }}
        onMouseLeave={() => window.setTimeout(() => set_num_leave(num_enter), 200)}
        onClick={e => {
          set_clicked(true)
          e.stopPropagation()
        }}>
        <InfoIcon />
      </button>
      {show && (
        <div
          key="info-area"
          className="info-area"
          onMouseEnter={() => set_over_info(true)}
          onMouseLeave={() => set_over_info(false)}
          onClick={e => e.stopPropagation()}>
          {props?.children}
        </div>
      )}
      {clicked && (
        <div
          key="click-away"
          className="click-away"
          onClick={e => {
            set_clicked(false)
            set_over_info(false)
            e.stopPropagation()
          }}
        />
      )}
    </div>
  )
}

import stories from '@app/ui_utils/stories'

stories(add => {
  add(
    <div>
      <Info>Some fantastic info 1</Info>
      <Info>Some fantastic info 2</Info>
      <Info>Some fantastic info 3</Info>
      <Info>Some fantastic info 4</Info>
      <Info>Some fantastic info 5</Info>
      <Info>Some fantastic info 6</Info>
      <Info>Some fantastic info 7</Info>
      <Info>Some fantastic info 8</Info>
    </div>
  )
    .name('8xInfo')
    .add(<Info>Some fantastic info</Info>)
    .snap()
})
