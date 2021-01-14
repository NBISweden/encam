import * as React from 'react'
import {css} from 'emotion'

import * as ui from './ui_utils'
import * as utils from './utils'

import * as C from './Content'

const classes = {
  Tabs: css({
    ...ui.flex_row,
    flexWrap: 'wrap',
    '& > button': css(
      `
        border: 2px #ccc solid;
        margin: 0;
        background: none;
        padding: 2px 9px;

        &:focus {
          outline: none;
        }
        cursor: pointer;
        z-index: 2;

        margin-right: 5;
        margin-bottom: 5;

        &.checked {
          border-color: #999;
          background: #ccc;
        }
      `
    ),
  }),
  Editor: css({
    padding: '15px 0px',
    background: '#fff',
    // ...ui.flex_column,
    '& > *': {
      marginBottom: 15,
      // flexGrow: 1,
    },
    '& textarea': {
      width: '100%',
      resize: 'vertical',
    },
  }),
}

export function EditNav() {
  const nav = C.useNav()
  const setter = C.useRawContentSetter()
  return (
    <>
      <div style={{...ui.flex_column}}>
        <b>Sections</b>
        <input
          type="text"
          defaultValue={nav.join(', ')}
          onChange={e => {
            const nav = e.target.value.split(/,/g).map(v => v.trim())
            setter(x => ({...x, nav}))
          }}
        />
        <span style={{opacity: 0.8, fontSize: '0.9em'}}>(use comma to separate)</span>
      </div>
      {nav.map(id => (
        <EditSection key={id} id={id} />
      ))}
    </>
  )
}

export function EditSections({keys}) {
  const [filter, set_filter] = React.useState('')
  let re = /.*/
  let msg
  try {
    re = new RegExp(filter)
  } catch (e) {
    console.log(e)
    msg = e.toString()
  }
  return [
    <div key="filter">
      Filter:{' '}
      <input type="text" value={filter} onInput={e => e.target && set_filter(e.target.value)} />
      <span style={{color: 'red'}}>{msg}</span>
    </div>,
    keys.map(
      id =>
        id.match(re) && (
          <EditSection
            key={id}
            id={id}
            onClickHeader={() =>
              set_filter(current => {
                const next = '^' + id + '$'
                return current !== next ? next : ''
              })
            }
          />
        )
    ),
  ]
}

export function Editor() {
  const sections = [
    {
      label: 'Header and footer',
      elem: (
        <>
          <EditSection id="header" />
          <EditSection id="footer" />
        </>
      ),
    },
    {
      label: 'Navigation',
      elem: <EditNav />,
    },
    {
      label: 'Cell descriptions',
      elem: <EditSections keys={C.cell_keys} />,
    },
    {
      label: 'Tumor descriptions',
      elem: <EditSections keys={C.tumor_keys} />,
    },
    {
      label: 'Low-level edit',
      elem: <RawEdit />,
    },
  ]
  const [section, set_section] = React.useState(sections[0])
  return (
    <div className={classes.Editor}>
      <div className={classes.Tabs}>
        {sections.map((s, i) => (
          <button
            className={section.label === s.label ? 'checked' : undefined}
            style={i === sections.length - 1 ? {marginLeft: 'auto', marginRight: 0} : {}}
            onClick={() => set_section(s)}>
            {s.label}
          </button>
        ))}
      </div>
      <div style={{margin: 5}}>{section.elem}</div>
    </div>
  )
}

import {PathReporter} from 'io-ts/PathReporter'

export function RawEdit() {
  const setter = C.useRawContentSetter()
  const [msg, set_msg] = React.useState('')
  return (
    <>
      <textarea
        defaultValue={utils.pp(C.useRawContent().content)}
        style={{height: '30vh'}}
        onChange={e => {
          try {
            const v = JSON.parse(e.target.value)
            const d = C.ContentType.decode(v)
            console.log(v, d)
            if (d._tag == 'Right') {
              set_msg('')
              setter(() => v)
            } else {
              set_msg(PathReporter.report(d).join('\n'))
            }
          } catch (e) {
            set_msg(e + '')
          }
        }}
      />
      {msg && <div style={{color: 'red', width: 500}}>{msg}</div>}
    </>
  )
}

export function EditSection({id, onClickHeader}: {id: string; onClickHeader: Function}) {
  const setter = C.useRawContentSetter()
  return (
    <div>
      <h3 style={{marginBottom: 0, cursor: onClickHeader && 'pointer'}} onClick={onClickHeader}>
        {id}
      </h3>
      <textarea
        rows={10}
        defaultValue={(C.useRawContent().content.sections[id] || []).join('\n')}
        style={{
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          fontSize: '0.875rem',
          lineHeight: 1.43,
        }}
        onChange={e => {
          const v = e.target.value
          setter(x => ({
            ...x,
            sections: {
              ...x.sections,
              [id]: v.split(/\n/g),
            },
          }))
        }}
      />
    </div>
  )
}
