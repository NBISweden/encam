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

import {boxplot_test_data} from '../test/data/boxplot'
import {form_test_conf} from '../test/data/form'
import * as domplots from './domplots'
import * as form from './Form'
import {FormAndPlot} from './FormAndPlot'

import * as ui from './ui_utils'

import {BoxplotWithControls} from './BoxplotWithControls'
import {Splash} from './splash'
import {backend as splash_test_backend} from '../test/data/splash'

export function Views() {
  const [tab, set_tab] = React.useState(0)
  const tabs = [
    {label: 'Splash',                component: <Splash/>},
    {label: 'Splash mock backend',   component: <Splash key="mock" backend={splash_test_backend}/>},
    {label: 'Boxplot with Controls', component: <ui.Paper><BoxplotWithControls data={boxplot_test_data} facet="cell"/></ui.Paper>},
    {label: 'Form',                  component: <ui.Paper><form.Form     conf={form_test_conf}/></ui.Paper>},
    {label: 'Group Form',            component: <ui.Paper><form.TwoForms conf={form_test_conf}/></ui.Paper>},
    {label: 'Form&Plot',             component: <FormAndPlot/>},
    {label: 'Domplots demo',         component: <domplots.Demo/>},
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

