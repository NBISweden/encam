import * as React from 'react'

import * as sc from 'styled-components'

import {css, div} from './css'

import * as backend from './backend'

import {
  AppBar,
  Tab,
  Tabs,
} from '@material-ui/core'

export const GlobalStyle = sc.createGlobalStyle`
  * {
    user-select: none;
  }
  html {
    box-sizing: border-box;
    overflow-y: scroll;
  }
  *, *:before, *:after {
    box-sizing: inherit;
  }
  html, body, #root {
    min-height: 100%;
    width: 100%;
  }
  body {
    margin: 0;
    font-family: sans-serif, sans;
  }
`

import {boxplot_test_data} from './boxplot_test_data'
import {form_test_conf} from './form_test_data'
import * as domplots from './domplots'
import * as form from './form'
import {FormAndPlot} from './form_and_plot'

import * as ui from './ui_utils'

import {Boxplot} from './boxplots'
import {Splash} from './splash'

export function Views() {
  const [tab, set_tab] = React.useState(0)
  const tabs = [
    {label: 'Splash',        component: <Splash/>},
    {label: 'Boxplot',       component: <ui.Paper><Boxplot data={boxplot_test_data} facet="cell"/></ui.Paper>},
    {label: 'Form',          component: <ui.Paper><form.Form     conf={form_test_conf}/></ui.Paper>},
    {label: 'Group Form',    component: <ui.Paper><form.TwoForms conf={form_test_conf}/></ui.Paper>},
    {label: 'Form&Boxplot',  component: <FormAndPlot/>},
    {label: 'Domplots demo', component: <domplots.Demo/>},
  ]
  ui.useKeydown(e => {
    if (e.key == '[') {
      set_tab(index => Math.max(0, index - 1))
    }
    if (e.key == ']') {
      set_tab(index => Math.min(index + 1, tabs.length - 1))
    }
  })
  return div(
    <GlobalStyle/>,
    <AppBar position="static" color="default">
      <Tabs
        value={tab}
        onChange={(_, i) => set_tab(i)}
        indicatorColor="primary"
        textColor="primary">
      {tabs.map(t => <Tab label={t.label} key={t.label}/>)}
      </Tabs>
    </AppBar>,
      tabs[tab].component
  )
}

