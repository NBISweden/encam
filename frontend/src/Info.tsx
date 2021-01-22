/**

  The Info component which shows a small circled i which when
  hovered over or clicked on displays extra content in a
  popup.

  The SectionInfo component makes an Info directly connected to
  a Section of the current contents.

*/
import * as React from 'react'
import {css} from 'emotion'

import * as ui from './ui_utils'

import InfoIcon from '@material-ui/icons/InfoOutlined'
import {Section} from './Content'

const info = css`
  position: relative;

  display: inline-block;

  & > button {
    border: none;
    margin: 0;
    background: none;
    padding: 0;
    &:focus {
      outline: none;
    }
    cursor: pointer;
  }

  & > .info-sign {
    position: relative;
  }

  &.right > .info-area {
    left: calc(100% + 7px);
    &::after {
      left: -7px;
      border-left: 1px black solid;
      border-bottom: 1px black solid;
      box-shadow: 2px 4px 4px -4px #333;
    }
  }

  &.left > .info-area {
    right: calc(100% + 7px);
    &::after {
      right: -7px;
      border-right: 1px black solid;
      border-top: 1px black solid;
      box-shadow: 4px 2px 4px -4px #333;
    }
  }

  & > .info-area {
    z-index: 20;
    color: #000;

    cursor: pointer;
    & > * {
      cursor: auto;
    }

    background: #fff;

    position: absolute;
    top: calc(50% - 29px);
    background: #fff;
    user-select: text;
    border-radius: 4px;
    padding: 18px 8px 20px;
    min-height: 42px;
    min-width: 66px;

    &::after {
      position: absolute;
      top: 21px;
      transform: rotate(45deg);
      width: 13px;
      height: 13px;
      background: #fff;
      z-index: -1;
      content: '';
    }

    width: 335px;

    & > :first-child {
      margin-top: 0px;
    }

    & > :last-child {
      margin-bottom: 0px;
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
    z-index: 19;
    background: #0001;
  }
`

const useGlobalState = ui.createGlobalState(0)

type Dir = 'left' | 'right'

export function SectionInfo(props: {id: string; dir?: Dir}) {
  return (
    <Info dir={props.dir}>
      <Section id={props.id} />
    </Info>
  )
}

export function Info(props: {children?: React.ReactNode; dir?: Dir}) {
  const [num_leader, set_num_leader] = useGlobalState()
  const [num_enter, set_num_enter] = React.useState(0)
  const [num_leave, set_num_leave] = React.useState(0)
  const [over_info, set_over_info] = React.useState(false)
  const [clicked, set_clicked] = React.useState(false)
  const show = clicked || ((num_enter > num_leave || over_info) && num_enter >= num_leader)
  const dir = props.dir || 'right'
  return (
    <div className={info + ' ' + dir}>
      <button
        className="info-sign"
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
        <InfoIcon fontSize="small" />
      </button>
      {show && (
        <div
          className="info-area"
          onMouseEnter={() => set_over_info(true)}
          onMouseLeave={() => set_over_info(false)}
          onClick={e => {
            set_clicked(true)
            e.stopPropagation()
          }}>
          {props?.children}
        </div>
      )}
      {clicked && (
        <button
          className="click-away"
          aria-label="close info"
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
      <Info dir="left">Some fantastic info 5</Info>
      <Info dir="left">Some fantastic info 6</Info>
      <Info dir="left">Some fantastic info 7</Info>
      <Info dir="left">Some fantastic info 8</Info>
    </div>
  )
    .name('8xInfo')
    .add(<Info>Some fantastic info</Info>)
    .snap()
})
