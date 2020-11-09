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
  WithEditor: css({
    ...ui.flex_row,
    '& > div': {
      minWidth: 600,
    },
  }),
  Editor: css({
    padding: 10,
    background: '#fff',
    borderLeft: '2px #888 solid',
    marginLeft: 8,
    // ...ui.flex_column,
    '& > *': {
      marginBottom: 15,
      // flexGrow: 1,
    },
    '& textarea': {
      width: '100%',
    },
  }),
}

export function WithEditor(props: {children: React.ReactNode}) {
  return (
    <C.WithEditableContent>
      <div className={classes.WithEditor}>
        <Editor />
        <div>{props.children}</div>
      </div>
    </C.WithEditableContent>
  )
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
        <span style={{opacity: 0.8, alignSelf: 'flex-end'}}>(use comma to separate)</span>
      </div>
      {nav.map(id => (
        <EditSection key={id} id={id} />
      ))}
    </>
  )
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
      elem: (
        <>
          {C.cell_keys.map(id => (
            <EditSection key={id} id={id} />
          ))}
        </>
      ),
    },
    {
      label: 'Tumor descriptions',
      elem: (
        <>
          {C.tumor_keys.map(id => (
            <EditSection key={id} id={id} />
          ))}
        </>
      ),
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
            style={i === sections.length - 1 ? {marginLeft: 'auto'} : {}}
            onClick={() => set_section(s)}>
            {s.label}
          </button>
        ))}
      </div>
      {section.elem}
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
        defaultValue={utils.pp(C.useRawContent())}
        style={{minHeight: '60%'}}
        onChange={e => {
          try {
            const v = JSON.parse(e.target.value)
            const d = C.ContentType.decode(v)
            if (d._tag == 'Right') {
              set_msg('')
              setter(v)
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

export function EditSection({id}: {id: string}) {
  const setter = C.useRawContentSetter()
  return (
    <div>
      <p style={{marginBottom: 0}}>
        <b>{id}</b>
      </p>
      <textarea
        rows={10}
        defaultValue={(C.useRawContent().sections[id] || []).join('\n')}
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
