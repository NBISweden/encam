import * as React from 'react'
import ReactMarkdown from 'react-markdown'

import * as utils from './utils'

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

const ContentCtx = React.createContext(test_content)
const SetContentCtx = React.createContext((_: (c: Content) => Content) =>
  console.error('No setter for context in place')
)

export function WithEditableContent(props: {children: React.ReactNode}) {
  const [content, set_content] = React.useState(test_content)
  console.log(utils.pp(content))
  return (
    <ContentCtx.Provider value={content}>
      <SetContentCtx.Provider value={set_content}>{props.children}</SetContentCtx.Provider>
    </ContentCtx.Provider>
  )
}

export function useRawContent() {
  return React.useContext(ContentCtx)
}

export function useRawContentSetter() {
  return React.useContext(SetContentCtx)
}

export function useNav() {
  return React.useContext(ContentCtx).nav
}

export function Section(props: {id: string}) {
  const {sections} = React.useContext(ContentCtx)
  const md = sections[props.id]
  return md ? (
    <ReactMarkdown source={md.join('\n')} />
  ) : (
    <span style={{fontSize: '0.8em'}}>
      Missing section: <code>{props.id}</code>!
    </span>
  )
}
