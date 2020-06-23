import * as React from 'react'

import * as sc from 'styled-components'

import {css, div} from './ui_utils'

import * as backend from './backend'

import {CssBaseline} from '@material-ui/core'

import {
  AppBar,
  // Tab,
  // Tabs,
} from '@material-ui/core'

export const GlobalStyle = sc.createGlobalStyle`
  * {
    user-select: none;
  }
  html {
    width: fit-content;
  }
`

import {boxplot_test_data} from '../test/data/boxplot'
import {kmplot_test_data} from '../test/data/kmplot'
import {form_test_conf} from '../test/data/form'
import * as domplots from './Domplot'
import * as form from './Form'
import {FormAndBoxPlot} from './FormAndBoxPlot'

import * as ui from './ui_utils'

import {VegaBoxplot} from './VegaBoxplot'
import {VegaKMPlot} from './VegaKMPlot'
import {BoxplotWithControls} from './BoxplotWithControls'
import {Splash} from './Splash'
import {backend as splash_test_backend} from '../test/data/splash'

import {Switch} from 'react-router-dom'

import {version} from './version'

export function Views() {
  const {Tabs, TabbedRoutes, set_tab} = ui.useRoutedTabs([
    {
      label: 'Splash',
      path: '/',
      exact: true,
      component: <Splash/>
    },
    {
      label: 'Form&Plot',
      path: '/FormAndPlot',
      component: <FormAndBoxPlot key="Form"/>
    },
    {
      label: 'Group Form&Plot',
      path: '/GroupFormAndPlot',
      component: <FormAndBoxPlot key="TwoForms" form={form.TwoForms}/>
    },
    {
      label: 'Form',
      path: '/Form',
      component:
        <ui.InlinePaper>
          <form.Form conf={form_test_conf}/>
        </ui.InlinePaper>
    },
    {
      label: 'Group Form',
      path: '/TwoForms',
      component:
        <ui.InlinePaper>
          <form.TwoForms conf={form_test_conf}/>
        </ui.InlinePaper>
    },
    {
      label: 'Boxplot with Controls',
      path: '/BoxplotWithControls',
      component:
        <ui.InlinePaper>
          <BoxplotWithControls data={boxplot_test_data} facet="cell"/>
        </ui.InlinePaper>
    },
    {
      label: 'Boxplot',
      path: '/Boxplot',
      component:
        <ui.InlinePaper>
          <VegaBoxplot
            data={boxplot_test_data}
            options={{
              facet:"cell",
              inner:["tumor", "group", "location"],
              color: ["tumor", "group"]
            }}/>
        </ui.InlinePaper>
    },
    {
      label: 'Kaplan-Meier plot',
      path: '/KMPlot',
      component:
        <ui.InlinePaper>
          <VegaKMPlot points={kmplot_test_data.points}/>
        </ui.InlinePaper>
    },
    {
      label: 'Domplots demo',
      path: '/Domplots',
      component:
        <ui.InlinePaper>
          <domplots.Demo/>
        </ui.InlinePaper>
    },
    {
      label: 'Splash mock backend',
      path: '/SplashMock',
      component: <Splash key="mock" backend={splash_test_backend}/>
    },
  ])
  ui.useKeydown(e => {
    if (e.key == '[') {
      set_tab(index => Math.max(0, index - 1))
    }
    if (e.key == ']') {
      set_tab((index, N) => Math.min(index + 1, N - 1))
    }
  }, [set_tab])
  return <>
    <CssBaseline/>
    <GlobalStyle/>
    <AppBar position="static" color="default">
      <Tabs/>
    </AppBar>
    <Switch>
      {TabbedRoutes}
    </Switch>
    {div(
      css`
        position: fixed;
        bottom: 15px;
        right: 30px;
      `,
      `version: ${version}`,
    )}
  </>
}

