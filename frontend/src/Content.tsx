import * as React from 'react'
import ReactMarkdown from 'react-markdown'

import * as utils from './utils'
import * as backend from './backend'

const lines = (xs: TemplateStringsArray) =>
  xs[0]
    .trim()
    .split(/\n/g)
    .map(x => x.trim())

export interface Content {
  sections: {
    [id: string]: string[]
  }
  nav: string[]
}

import {cells} from './db'
export const cell_keys = cells

const cell_sections = Object.fromEntries(
  cell_keys.map(cell => [
    cell,
    [
      `### ${utils.pretty(cell)}`,
      `Description of ${utils.pretty(cell)} and its function in relation to cancer.`,
    ],
  ])
)

export const tumor_codes: Record<string, string> = {
  BLCA: 'Bladder Urothelial Carcinoma',
  BRCA: 'Breast invasive carcinoma',
  COAD: 'Colon adenocarcinoma',
  ESCA: 'Esophageal carcinoma',
  KRCC: 'Kidney renal cell carcinoma',
  LUAD: 'non small cell lung cancer adenocarcinoma',
  LUSC: 'non small cell lung cancer squamous cell carcinoma',
  MEL: 'Melanoma',
  OVNSA: 'Ovarian Carcinoma non serous',
  OVSA: 'Ovarian Carcinoma serous',
  PPADi: 'Periampullary and pancreatic adenocarcinoma intestinal type',
  PPADpb: 'Periampullary and pancreatic adenocarcinoma pancreatobiliary type',
  PRAD: 'Prostate adenocarcinoma',
  READ: 'Rectum adenocarcinoma',
  STAD: 'Stomach adenocarcinoma',
  UCEC: 'Uterine Corpus Endometrial Carcinoma',
}

export const tumor_keys = Object.keys(tumor_codes)

const tumor_sections = Object.fromEntries(
  Object.entries(tumor_codes).map(([tumor, expanded]) => [
    tumor,
    [`### ${expanded}`, `Description of ${tumor}.`],
  ])
)

const test_content: Content = {
  sections: {
    header: lines`
      # Encyclopedia of Cancer (Immune) Microenvironment
      Web portal of cell-resolution data of the tumor microenvironment in human cancer.
    `,
    footer: lines`
      Contact details:
      [Artur Mezheyeuski](https://katalog.uu.se/profile/?id=N16-2052),
      [Patrick Micke](https://katalog.uu.se/empinfo/?id=N5-811)
    `,
    About: lines`
      # About
      This is a web portal of cell-resolution data of the tumor microenvironment in human cancer.
    `,
    Links: lines`
      # Links
      Contact details:
      * [Artur Mezheyeuski](https://katalog.uu.se/profile/?id=N16-2052)
      * [Patrick Micke](https://katalog.uu.se/empinfo/?id=N5-811)
    `,
    References: lines`
      # References
      Contact details:
      * [Artur Mezheyeuski](https://katalog.uu.se/profile/?id=N16-2052)
      * [Patrick Micke](https://katalog.uu.se/empinfo/?id=N5-811)
    `,
    ...cell_sections,
    ...tumor_sections,
  },
  nav: lines`
    About
    Links
    References
  `,
}

import * as t from 'io-ts'

export const ContentType: t.Type<Content> = t.type({
  sections: t.record(t.string, t.array(t.string)),
  nav: t.array(t.string),
})

console.log(JSON.stringify(test_content, undefined, 2))

export interface ContentAndStatus {
  content: Content
  loading: boolean
}

const empty: Content = {sections: {}, nav: []}
const quite_empty: Content = {sections: {header: [], footer: []}, nav: []}

const ContentCtx = React.createContext({content: test_content, loading: false})
const SetContentCtx = React.createContext({
  set_content: (_: (c: Content) => Content) => console.error('No setter for content in place'),
  msg: '',
})

export function WithEditableContent(props: {children: React.ReactNode, url?: string}) {
  const [content, set_content_raw] = React.useState(quite_empty)
  const content_ref = React.useRef(content)
  content_ref.current = content
  const [loading, set_loading] = React.useState(false)
  const url = props.url
  const [msg, set_msg] = React.useState(url ? '' : 'no backend')
  const value = {content, loading}
  const req = backend.useRequestFn()
  React.useEffect(() => {
    if (url) {
      set_loading(true)
      set_msg('loading...')
      req(url).then(c => {
        set_loading(false)
        set_msg('ready!')
        set_content_raw(c)
      }).catch(e => {
        set_loading(false)
        set_msg(e.toString())
        console.error(e)
      })
    }
  }, [url])
  const timeout_ref = React.useRef(undefined)
  const set_content = React.useCallback(k => {
    console.log('loading', loading)
    if (loading == false) {
      let c
      set_content_raw(content => { return c = k(content) })
      console.log('hmm', c)
      window.clearTimeout(timeout_ref.current)
      set_msg('...')
      timeout_ref.current = window.setTimeout(() => {
        set_msg('saving...')
        req(url, c).then(res => {
          if (res.success) {
            const saved = JSON.stringify(c)
            const now = JSON.stringify(content_ref.current)
            console.log(saved, now, saved == now)
            if (saved == now) {
              set_msg('saved')
            } else {
              set_msg('....')
            }
          } else  {
            set_msg(res.reason)
          }
        }).catch(e => {
          set_msg(e.toString())
          console.error(e)
        })
      }, 500)
    }
  }, [loading, url])
  const proto_setter = {set_content, msg}
  const setter = React.useMemo(() => proto_setter, Object.values(proto_setter))
  return (
    <SetContentCtx.Provider value={setter}>
      <ContentCtx.Provider value={value}>
        {props.children}
      </ContentCtx.Provider>
    </SetContentCtx.Provider>
  )
}

export function WithBackendContent(props: {children: React.ReactNode; url: string}) {
  const content = backend.useRequest(props.url)
  const value = content ? {loading: false, content} : {loading: true, content: empty}
  return <ContentCtx.Provider value={value}>{props.children}</ContentCtx.Provider>
}

export function useRawContent() {
  return React.useContext(ContentCtx)
}

export function useRawContentSetter() {
  return React.useContext(SetContentCtx)
}

export function useNav() {
  return React.useContext(ContentCtx).content?.nav || []
}

export function Section(props: {id: string}) {
  const {loading, content} = React.useContext(ContentCtx)
  const md = content?.sections[props.id]
  return md ? (
    <ReactMarkdown source={md.join('\n')} />
  ) : loading ? (
    <span style={{fontSize: '0.8em'}}>Loading {utils.pretty(props.id)} section...</span>
  ) : (
    <div
      style={{
        padding: 10,
        margin: 10,
        border: '2px red solid',
        background: '#fff',
        color: 'red',
      }}>
      Missing <code>{props.id}</code> section!
    </div>
  )
}
