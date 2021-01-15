import * as React from 'react'
import {css} from 'emotion'
import * as ui from './ui_utils'

import {Editor} from './Editor'

import * as backend from './backend'

import {Main, WithMainTheme} from './Main'
import * as C from './Content'

import * as G from './GlobalStyle'

interface Button {
  buttonText: string
  onButtonClick: Function
}
function Button({buttonText, onButtonClick}: Button) {
  return (
    <span
      style={{
        padding: '4px 14px',
        margin: 4,
        minWidth: 180,
        display: 'inline-block',
        border: '2px #999 solid',
        background: '#eee',
        cursor: 'pointer',
      }}
      onClick={() => onButtonClick()}>
      {buttonText}
    </span>
  )
}

function DoubleButton({buttonText, onButtonClick}: Button) {
  const [confirming, set_confirming] = React.useState(false)
  const text = confirming ? 'Click again to confirm!' : buttonText
  React.useEffect(() => {
    if (confirming) {
      const id = window.setTimeout(() => {
        set_confirming(false)
      }, 2000)
      return () => window.clearTimeout(id)
    }
  }, [confirming])
  return (
    <Button
      buttonText={text}
      onButtonClick={() => {
        if (confirming) {
          onButtonClick()
        }
        set_confirming(b => !b)
      }}
    />
  )
}

function LoginHeader(props: {buttons: React.ReactElement}) {
  const st = backend.useRequest('login_status')
  return (
    <div
      style={{
        width: 1100,
        minHeight: 56,
        margin: '0 auto',
        padding: 0,
        ...ui.flex_row,
        alignItems: 'center',
      }}>
      <div style={{flex: '0 0 auto'}}>Administrator view</div>
      <div style={{flex: '1 0 auto', textAlign: 'center'}}>{props.buttons}</div>
      <div style={{flex: '0 0 auto', fontWeight: 500, color: '#c00'}}>
        {!st || st.whitelisted || (
          <span style={{margin: 'auto', paddingRight: 20}}>not whitelisted!</span>
        )}
      </div>
      <div style={{flex: '0 0 auto'}}>
        {st?.logged_in ? (
          <img
            style={{
              border: '2px rgb(134,72,89) solid',
              borderRadius: '100%',
              height: 48,
              margin: 4,
            }}
            src={st.picture}
            alt={st.name + ' ' + st.email}
          />
        ) : (
          <a href="/api/login">login...</a>
        )}
      </div>
    </div>
  )
}

export default function Admin() {
  const st = backend.useRequest('login_status')
  const [staging, set_staging] = React.useState(true)
  const [key, set_refresh_key] = React.useState(0)
  const whitelisted = st?.whitelisted
  const buttons = whitelisted && (
    <>
      <DoubleButton
        buttonText="Move staging to live"
        onButtonClick={() => set_refresh_key(key + 1)}
      />
      <Button
        buttonText={staging ? 'Staging version' : 'Live version'}
        onButtonClick={() => set_staging(b => !b)}
      />
    </>
  )
  return (
    <C.WithEditableContent>
      <G.ScrollBodyGlobalStyle />
      <div style={{...ui.flex_column, width: '100%', background: '#fff', zIndex: 20}}>
        <LoginHeader buttons={buttons} />
        <div style={{...ui.flex_row, ['--color' as any]: 'rgb(100,148,202)'}}>
          <div style={{flex: '1 0 auto'}} />
          <div
            style={{
              border: '4px var(--color) solid',
              height: '40vh',
              overflow: 'scroll',
              resize: 'vertical',
              flex: '4 0 auto',
            }}
            key={key}>
            {staging ? (
              <Main />
            ) : (
              <C.WithBackendContent url="content.json">
                <Main />
              </C.WithBackendContent>
            )}
          </div>
          <div style={{flex: '1 0 auto'}} />
        </div>
        <div style={{width: 1100, margin: '0 auto'}}>{whitelisted && <Editor />}</div>
      </div>
    </C.WithEditableContent>
  )
}

import {MockBackend} from './backend'

import stories from '@app/ui_utils/stories'
stories(add => {
  add(<Admin />)
})
