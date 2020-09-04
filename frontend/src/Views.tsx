import * as React from 'react'

import * as sc from 'styled-components'

import {css, div} from './ui_utils'

import {CssBaseline} from '@material-ui/core'

import {AppBar} from '@material-ui/core'

import ReactMarkdown from 'react-markdown'

import * as boxplot_data from './data/boxplot'
import * as km_data from './data/kmplot'

import {DomplotCSS} from './DomplotCSS'
import * as form_data from './data/form'
import * as domplots from './Domplot'
import * as form from './Form'
import {FormAndBoxPlot, FormAndKMPlot} from './FormAndPlot'
import {FormAndPlotView, LoadingPlot} from './FormAndPlotView'
import * as ui from './ui_utils'

import {cucount} from './Vega/CumulativeCountPlot'

import {Boxplot} from './Vega/Boxplot'
import {KMPlot} from './Vega/KMPlot'
import {BoxplotWithControls} from './BoxplotWithControls'
import {KMPlotWithControls, KMPlotWithControlsView} from './KMPlotWithControls'
import {Splash} from './Splash'
import * as splash_data from './data/splash'
import {MockBackend} from './backend'

import {Switch} from 'react-router-dom'

import {version} from './version'

import {makeStyles} from '@material-ui/core/styles'

import {GlobalStyle, MainGlobalStyle} from './GlobalStyle'

import {cell_color} from './cell_colors'

import {ThemeProvider, createMuiTheme} from '@material-ui/core/styles'

const main = `
  # Encyclopedia of Cancer (Immune) Microenvironment
  Web portal of cell-resolution data of the tumor microenvironment in human cancer.
`

const useStyles = makeStyles({
  View: {
    '& h1, & h2, & h3': {
      fontFamily: '"Merriweather Sans", sans',
      fontWeight: 300,
    },
  },
  Main: {
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
  },
  Modules: {
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
  },
})

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

export function Main(props = {version: <span />}) {
  const classes = useStyles()
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
    <ThemeProvider theme={theme}>
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
          {props.version}
        </footer>
      </div>
    </ThemeProvider>
  )
}

export function Views() {
  const {Tabs, TabbedRoutes, set_tab, tab} = ui.useRoutedTabs([
    {
      label: 'Main',
      path: '/',
      exact: true,
      component: (
        <Main
          version={
            <div
              onClick={() => set_tab(index => index + 1)}
              style={{cursor: 'pointer', float: 'right'}}>
              version: {version}
            </div>
          }
        />
      ),
    },
    {
      label: 'Splash',
      path: '/Splash',
      component: (
        <ui.InlinePaper>
          <Splash />
        </ui.InlinePaper>
      ),
    },
    {
      label: 'Form & BoxPlot',
      path: '/FormAndBoxPlot',
      component: <FormAndBoxPlot key="Form" />,
    },
    {
      label: 'Group Form & BoxPlot',
      path: '/GroupFormAndBoxPlot',
      component: <FormAndBoxPlot key="TwoForms" form={form.TwoForms} />,
    },
    {
      label: 'KM Form & Plot',
      path: '/FormAndKMPlot',
      component: <FormAndKMPlot />,
    },
    {
      label: 'Form',
      path: '/Form',
      component: (
        <ui.InlinePaper>
          <form.Form conf={form_data.form_test_conf} />
        </ui.InlinePaper>
      ),
    },
    {
      label: 'Group Form',
      path: '/TwoForms',
      component: (
        <ui.InlinePaper>
          <form.TwoForms conf={form_data.form_test_conf} />
        </ui.InlinePaper>
      ),
    },
    {
      label: 'KMForm',
      path: '/KMForm',
      component: (
        <ui.InlinePaper>
          <form.KMForm conf={form_data.form_test_conf} />
        </ui.InlinePaper>
      ),
    },
    {
      label: 'Boxplot with Controls',
      path: '/BoxplotWithControls',
      component: (
        <ui.InlinePaper>
          <BoxplotWithControls data={boxplot_data.rows} facet="cell" />
        </ui.InlinePaper>
      ),
    },
    {
      label: 'KMPlot With Controls',
      path: '/KMPlotWithControls',
      component: (
        <MockBackend request={km_data.request}>
          <KMPlotWithControls filter={km_data.filter} />,
        </MockBackend>
      ),
    },
    {
      label: 'KMPlot With Controls View',
      path: '/KMPlotWithControlsView',
      component: (
        <>
          <KMPlotWithControlsView
            plot_data={km_data.make_points(2)}
            cu_data={cucount(km_data.expression, [26])}
            statistics={km_data.survival}
            cutoffs={[26]}
            set_cutoffs={() => 0}
            location_node={'location: stroma'}
            num_groups_node={'groups: 2'}
            loading={false}
          />
        </>
      ),
    },
    {
      label: 'Boxplot',
      path: '/Boxplot',
      component: (
        <ui.InlinePaper>
          <Boxplot
            data={boxplot_data.rows}
            options={{
              facet: 'cell',
              inner: ['tumor', 'group', 'location'],
              color: ['tumor', 'group'],
            }}
          />
        </ui.InlinePaper>
      ),
    },
    {
      label: 'KMPlot',
      path: '/KMPlot',
      component: (
        <ui.InlinePaper>
          <KMPlot data={km_data.make_points(4)} />
        </ui.InlinePaper>
      ),
    },
    {
      label: 'Domplots',
      path: '/Domplots',
      component: (
        <ui.InlinePaper>
          <domplots.Demo />
        </ui.InlinePaper>
      ),
    },
    {
      label: 'Domplots Mock',
      path: '/DomplotsMock',
      component: (
        <ui.InlinePaper>
          <MockBackend request={splash_data.request}>
            <domplots.Demo />
          </MockBackend>
        </ui.InlinePaper>
      ),
    },
    {
      label: 'Splash Mock',
      path: '/SplashMock',
      component: (
        <MockBackend request={splash_data.request}>
          <Splash key="mock" />
        </MockBackend>
      ),
    },
    {
      label: 'Form and Plot UI',
      path: '/FormAndPlotUI',
      component: (
        <div>
          <FormAndPlotView />
          <FormAndPlotView form={<h2>Form</h2>} />
          <FormAndPlotView form={<h2>Form</h2>} plot={<LoadingPlot loading={true} />} />
          <FormAndPlotView
            form={<h2>Form</h2>}
            plot={<LoadingPlot plot={<h2>Example plot view</h2>} />}
          />
          <FormAndPlotView
            form={<h2>Form</h2>}
            plot={<LoadingPlot plot={<h2>Example plot view</h2>} loading={true} />}
          />
        </div>
      ),
    },
  ])
  ui.useKeydown(
    e => {
      if (e.key == '[') {
        set_tab(index => Math.max(0, index - 1))
      }
      if (e.key == ']') {
        set_tab((index, N) => Math.min(index + 1, N - 1))
      }
    },
    [set_tab]
  )
  React.useEffect(() => {
    document.title = `encima: ${tab.label}`
  }, [tab.label])
  const classes = useStyles()
  return tab.label === 'Main' ? (
    <Switch>{TabbedRoutes}</Switch>
  ) : (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyle />
      <div style={{...ui.flex_row, minHeight: '100%'}}>
        <div style={{...ui.flex_column, flexShrink: 0, borderRight: '1px #ddd solid'}}>
          <Tabs variant="scrollable" orientation="vertical" />
          <div style={{flexGrow: 1, borderBottom: '1px #ddd solid'}} />
          <div style={{margin: 15, alignSelf: 'center'}}>version: {version}</div>
        </div>
        <div className={classes.View}>
          <Switch>{TabbedRoutes}</Switch>
        </div>
      </div>
    </ThemeProvider>
  )
}
