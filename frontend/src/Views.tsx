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

import {version} from './version'

export function Views() {
  const [tab, set_tab] = React.useState(0)
  const tabs = [
    {label: 'Splash',                component: <Splash/>},
    {label: 'Splash mock backend',   component: <Splash key="mock" backend={splash_test_backend}/>},
    {label: 'Boxplot',               component: <ui.InlinePaper><VegaBoxplot data={boxplot_test_data} options={{facet:"cell", inner:["tumor", "group", "location"], color: ["tumor", "group"]}}/></ui.InlinePaper>},
    {label: 'Kaplan-Meier plot',     component: <ui.InlinePaper><VegaKMPlot points={kmplot_test_data.points}/></ui.InlinePaper>},
    {label: 'Boxplot with Controls', component: <ui.InlinePaper><BoxplotWithControls data={boxplot_test_data} facet="cell"/></ui.InlinePaper>},
    {label: 'Form',                  component: <ui.InlinePaper><form.Form     conf={form_test_conf}/></ui.InlinePaper>},
    {label: 'Group Form',            component: <ui.InlinePaper><form.TwoForms conf={form_test_conf}/></ui.InlinePaper>},
    {label: 'Form&Plot',             component: <FormAndBoxPlot key="Form"/>},
    {label: 'Group Form&Plot',       component: <FormAndBoxPlot key="TwoForms" form={form.TwoForms}/>},
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

