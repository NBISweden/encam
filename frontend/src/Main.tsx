import * as React from 'react'
import * as ui from './ui_utils'
import {css} from 'emotion'
import {ThemeProvider, createMuiTheme} from '@material-ui/core/styles'

import {MainGlobalStyle} from './GlobalStyle'

import {cell_color} from './cell_colors'

import {Splash} from './Splash'
import * as form from './Form'

import {FormAndBoxPlot, FormAndKMPlot} from './FormAndPlot'

import {Section, useNav} from './Content'

const classes = {
  Root: css(
    `
      background: #eee;
      background: linear-gradient(0deg, #ddd 0%, #fafafa 100%);
      background-repeat: no-repeat;
      margin: 0px auto;
      width: 100%;
      &, & > * {
      min-height: 100%;
      }
    `
  ),
  Main: css({
    // flexGrow: 1,
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
      '& > :not(nav)': {
        maxWidth: 900,
        paddingLeft: 10,
        userSelect: 'text',
      },
    },
    '& > footer': {
      padding: 20,
      userSelect: 'text',
      // marginTop: 40,
      '& p': {
        display: 'inline',
        padding: 0,
        margin: 0,
      },
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
    '& > section': {
      margin: '0px 10px',
    },
    '& > header, & > footer': {
      '& h1': {fontSize: 32},
      '& h2': {fontSize: 22},
      '& h3': {fontSize: 18},
      width: 1100,
      color: '#f8f8f8',
      background: cell_color('iDC'),

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

const modules = [
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

type Module = typeof modules[0]

type Action<A> = (next_value: A) => void

export function Modules(props: {resetChan?: ui.Channel<void>}) {
  const [Module, set_Module] = React.useState(undefined as undefined | Module)
  props.resetChan?.on(() => set_Module(undefined))
  return (
    <>
      <div className={classes.Modules}>
        {modules.map(M => (
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
    </>
  )
}

export function Header(props: {onClickHeader?: Action<any>; onNav?: Action<string>}) {
  const nav = useNav()
  console.log(nav)
  return (
    <header>
      <nav>
        <ul>
          {nav.map(link => (
            <li
              key={link}
              onClick={() => props.onNav && props.onNav(link)}
              style={{cursor: 'pointer'}}>
              {link}
            </li>
          ))}
        </ul>
      </nav>
      <div onClick={props.onClickHeader} style={{cursor: 'pointer'}}>
        <Section id="header" />
      </div>
    </header>
  )
}

export function Main({version = <React.Fragment /> as React.ReactNode}) {
  const resetChan = ui.useChannel<void>()
  const [section, set_section] = React.useState(undefined as undefined | string)
  return (
    <div className={classes.Root}>
      <MainGlobalStyle />
      <div className={classes.Main}>
        <Header
          onClickHeader={() => {
            resetChan.send()
            set_section(undefined)
          }}
          onNav={set_section}
        />
        {section ? (
          <section>
            <Section id={section} />
          </section>
        ) : (
          <>
            <Splash />
            <Modules resetChan={resetChan} />
          </>
        )}
        <div style={{flexGrow: 1}} />
        <footer>
          <Section id="footer" />
          <div style={{float: 'right'}}>{version}</div>
        </footer>
      </div>
    </div>
  )
}

import stories from '@app/ui_utils/stories'
stories(add => {
  add({as_story: <Main />})
  add(<Header />).wrap(c => <div className={classes.Main}>{c}</div>)
  add(<Modules />).wrap(c => <div className={classes.Main}>{c}</div>)
})
