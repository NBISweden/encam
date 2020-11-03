import * as React from 'react'
import {CssBaseline} from '@material-ui/core'
import ReactMarkdown from 'react-markdown'
import * as ui from './ui_utils'
import {css} from 'emotion'
import {ThemeProvider, createMuiTheme} from '@material-ui/core/styles'

import {MainGlobalStyle} from './GlobalStyle'

import {cell_color} from './cell_colors'

import {Splash} from './Splash'
import * as form from './Form'
import {FormAndBoxPlot, FormAndKMPlot} from './FormAndPlot'

const main = `
  # Encyclopedia of Cancer (Immune) Microenvironment
  Web portal of cell-resolution data of the tumor microenvironment in human cancer.
`

const classes = {
  Main: css({
    '& h1, & h2, & h3': {
      fontFamily: '"Merriweather Sans", sans',
      fontWeight: 300,
    },
    background: '#fff',
    boxShadow: '0 0 14 0 #0002',
    margin: '0 auto',
    width: 1100,
    // width: 'fit-content',
    // border: '1px black solid',
    ...ui.flex_column,
    '& > *': {
      margin: '0 auto',
    },
    '& > header': {
      paddingLeft: 20,
      paddingTop: 20,
      paddingBottom: 65,
    },
    '& > footer': {
      padding: 20,
      // marginTop: 40,
      '& a': {
        padding: 0,
        color: '#f8f8f8',
        textDecoration: 'none',
        '&:hover': {
          color: '#ffffff',
          textDecoration: 'underline',
        },
      },
    },
    '& > header, & > footer': {
      '& h1': {fontSize: 32},
      '& h2': {fontSize: 22},
      '& h3': {fontSize: 18},
      width: 1100,
      color: '#f8f8f8',
      background: cell_color('iDC'),
      '& > :not(nav)': {
        maxWidth: 900,
        paddingLeft: 10,
        userSelect: 'text',
      },
      '& > nav': {
        marginLeft: 'auto',
        marginRight: 0,
        paddingBottom: 0,
        ...ui.flex_row,
        '& > ul': {
          marginLeft: 'auto',
          marginRight: 40,
          // textTransform: 'uppercase',
          fontSize: '0.96em',
          fontWeight: 100,
          ...ui.flex_row,
          listStyleType: 'none',
          '& > li:not(:first-child)': {
            marginLeft: 15,
          },
          '& > li': {
            cursor: 'pointer',
            '&:hover': {
              color: '#ffffff',
              textDecoration: 'underline',
            },
          },
        },
      },
    },
  }),
  Modules: css({
    width: 1100,
    color: '#f8f8f8',
    // marginTop: 40,
    ...ui.flex_row,
    '& > div': {
      flexGrow: 1,
      flexBasis: 0,
      ...ui.flex_row,
      margin: 'auto',
      '& > div': {
        margin: 'auto',
      },
      cursor: 'pointer',
      background: cell_color('iDC'),
      '&:hover': {
        background: cell_color('mDC'),
        color: '#fff',
      },
      '&.selected:not(:hover)': {
        color: '#222',
        background: cell_color('pDC'),
      },
    },
  }),
}

const theme = createMuiTheme({
  palette: {
    primary: {
      main: cell_color('iDC'),
    },
    secondary: {
      main: cell_color('CD8_Treg'),
    },
  },
})

export function WithMainTheme(props: {children: React.ReactNode}) {
  return <ThemeProvider theme={theme}>{props.children}</ThemeProvider>
}

export function Main({version = <span />}) {
  const Modules = [
    {
      name: 'Box plots',
      component: <FormAndBoxPlot key="Form" />,
    },
    {
      name: 'Grouped box plots',
      component: <FormAndBoxPlot key="TwoForms" form={form.TwoForms} />,
    },
    {
      name: 'Kaplan-Meier plots',
      component: <FormAndKMPlot />,
    },
    {
      name: 'Clustering',
      component: <h3 style={{margin: '20 20'}}>Module still under construction!</h3>,
    },
  ]
  // const mini = true
  const mini = false
  const [Module, set_Module] = React.useState(
    mini ? Modules[0] : (undefined as undefined | typeof Modules[0])
  )
  return (
    <WithMainTheme>
      <CssBaseline />
      <MainGlobalStyle />
      <div className={classes.Main}>
        {mini || (
          <>
            <header onClick={() => set_Module(undefined)}>
              <nav>
                <ul>
                  <li>About</li>
                  <li>Links</li>
                  <li>References</li>
                </ul>
              </nav>
              <ReactMarkdown source={main} />
            </header>
            <Splash />
          </>
        )}
        <div className={classes.Modules}>
          {Modules.map(M => (
            <div
              onClick={() => {
                set_Module(M)
                window.setTimeout(() => document.querySelector('#Module')?.scrollIntoView(), 100)
              }}
              key={M.name}
              className={Module && M.name == Module.name ? 'selected' : undefined}>
              <div>
                <h3>{M.name}</h3>
              </div>
            </div>
          ))}
        </div>
        <div
          style={{overflowX: 'auto', ...ui.flex_row, marginLeft: 0, width: '100%', minHeight: 20}}
          id="Module">
          {Module && Module.component}
        </div>
        <div style={{flexGrow: 1}} />
        <footer>
          Contact details:{' '}
          <a href="https://katalog.uu.se/profile/?id=N16-2052">Artur Mezheyeuski</a>,{' '}
          <a href="https://katalog.uu.se/empinfo/?id=N5-811">Patrick Micke</a>
          {version}
        </footer>
      </div>
    </WithMainTheme>
  )
}

import stories from '@app/ui_utils/stories'
stories(import.meta, add => add({as_story: <Main />}))
