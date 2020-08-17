import * as React from 'react'

import * as sc from 'styled-components'

import {css, div} from './ui_utils'

import {CssBaseline} from '@material-ui/core'

import {AppBar} from '@material-ui/core'

export const GlobalStyle = sc.createGlobalStyle`
  * {
    user-select: none;
  }
  html {
    width: fit-content;
  }
`

import {boxplot_test_data} from '../test/data/boxplot'
import {kmplot_test_data, kmplot_test_filter, kmplot_test_request} from '../test/data/kmplot'
import {form_test_conf} from '../test/data/form'
import * as domplots from './Domplot'
import * as form from './Form'
import {FormAndBoxPlot, FormAndKMPlot} from './FormAndPlot'
import {FormAndPlotUI, LoadingPlot} from './FormAndPlotUI'
import * as ui from './ui_utils'

import {VegaBoxplot} from './VegaBoxplot'
import {VegaKMPlot} from './VegaKMPlot'
import {BoxplotWithControls} from './BoxplotWithControls'
import {KMPlotWithControls} from './KMPlotWithControls'
import {Splash} from './Splash'
import * as splash_test_data from '../test/data/splash'
import {MockBackend} from './backend'

import {Switch} from 'react-router-dom'

import {version} from './version'

export function Views() {
  const {Tabs, TabbedRoutes, set_tab, tab} = ui.useRoutedTabs([
    {
      label: 'Splash',
      path: '/',
      exact: true,
      component: <Splash />,
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
          <form.Form conf={form_test_conf} />
        </ui.InlinePaper>
      ),
    },
    {
      label: 'Group Form',
      path: '/TwoForms',
      component: (
        <ui.InlinePaper>
          <form.TwoForms conf={form_test_conf} />
        </ui.InlinePaper>
      ),
    },
    {
      label: 'KMForm',
      path: '/KMForm',
      component: (
        <ui.InlinePaper>
          <form.KMForm conf={form_test_conf} />
        </ui.InlinePaper>
      ),
    },
    {
      label: 'Boxplot with Controls',
      path: '/BoxplotWithControls',
      component: (
        <ui.InlinePaper>
          <BoxplotWithControls data={boxplot_test_data} facet="cell" />
        </ui.InlinePaper>
      ),
    },
    {
      label: 'KMPlot With Controls',
      path: '/KMPlotWithControls',
      component: (
        <MockBackend request={kmplot_test_request}>
          <KMPlotWithControls filter={kmplot_test_filter} />,
        </MockBackend>
      ),
    },
    {
      label: 'Boxplot',
      path: '/Boxplot',
      component: (
        <ui.InlinePaper>
          <VegaBoxplot
            data={boxplot_test_data}
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
          <VegaKMPlot points={kmplot_test_data.points} />
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
          <MockBackend request={splash_test_data.request}>
            <domplots.Demo />
          </MockBackend>
        </ui.InlinePaper>
      ),
    },
    {
      label: 'Splash Mock',
      path: '/SplashMock',
      component: (
        <MockBackend request={splash_test_data.request}>
          <Splash key="mock" />
        </MockBackend>
      ),
    },
    {
      label: 'Form and Plot UI',
      path: '/FormAndPlotUI',
      component: (
        <div>
          <FormAndPlotUI />
          <FormAndPlotUI form={<h2>Form</h2>} />
          <FormAndPlotUI form={<h2>Form</h2>} plot={<LoadingPlot loading={true} />} />
          <FormAndPlotUI
            form={<h2>Form</h2>}
            plot={<LoadingPlot plot={<h2>Example plot view</h2>} />}
          />
          <FormAndPlotUI
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
  return (
    <>
      <CssBaseline />
      <GlobalStyle />
      <div style={{...ui.flex_row, minHeight: '100%'}}>
        <div style={{...ui.flex_column, flexShrink: 0, borderRight: '1px #ddd solid'}}>
          <Tabs variant="scrollable" orientation="vertical" />
          <div style={{flexGrow: 1, borderBottom: '1px #ddd solid'}} />
          <div style={{margin: 15, alignSelf: 'center'}}>version: {version}</div>
        </div>
        <div>
          <Switch>{TabbedRoutes}</Switch>
        </div>
      </div>
    </>
  )
}
