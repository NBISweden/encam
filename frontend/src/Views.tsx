import * as React from 'react'

import * as sc from 'styled-components'

import {css, div} from './css'

import * as backend from './backend'

import {CssBaseline} from '@material-ui/core'

import {
  AppBar,
  Tab,
  Tabs,
} from '@material-ui/core'

export const GlobalStyle = sc.createGlobalStyle`
  * {
    user-select: none;
  }
  html, body, #root {
    min-height: 100%;
    width: 100%;
  }
`

import {boxplot_test_data} from '../test/data/boxplot'
import {form_test_conf} from '../test/data/form'
import * as domplots from './Domplot'
import * as form from './Form'
import {FormAndPlot} from './FormAndPlot'

import * as ui from './ui_utils'

import {BoxplotWithControls} from './BoxplotWithControls'
import {Splash} from './Splash'
import {backend as splash_test_backend} from '../test/data/splash'

export function Views() {
  const [tab, set_tab] = React.useState(0)
  const tabs = [
    {label: 'Splash',                component: <Splash/>},
    {label: 'Splash mock backend',   component: <Splash key="mock" backend={splash_test_backend}/>},
    {label: 'Boxplot with Controls', component: <ui.InlinePaper><BoxplotWithControls data={boxplot_test_data} facet="cell"/></ui.InlinePaper>},
    {label: 'Form',                  component: <ui.InlinePaper><form.Form     conf={form_test_conf}/></ui.InlinePaper>},
    {label: 'Group Form',            component: <ui.InlinePaper><form.TwoForms conf={form_test_conf}/></ui.InlinePaper>},
    {label: 'Form&Plot',             component: <FormAndPlot key="Form"/>},
    {label: 'Group Form&Plot',       component: <FormAndPlot key="TwoForms" form={form.TwoForms}/>},
    {label: 'Domplots demo',         component: <ui.InlinePaper><domplots.Demo/></ui.InlinePaper>},
  ]
  ui.useKeydown(e => {
    if (e.key == '[') {
      set_tab(index => Math.max(0, index - 1))
    }
    if (e.key == ']') {
      set_tab(index => Math.min(index + 1, tabs.length - 1))
    }
  })
  return <>
    <CssBaseline/>
    <GlobalStyle/>
    <AppBar position="static" color="default">
      <Tabs
        value={tab}
        onChange={(_, i) => set_tab(i)}
        indicatorColor="primary"
        textColor="primary">
      {tabs.map(t => <Tab label={t.label} key={t.label}/>)}
      </Tabs>
    </AppBar>
    {tabs[tab].component}
  </>
}

