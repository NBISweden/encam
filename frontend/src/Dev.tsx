/**

  This shows the stories defined in other files.

*/
import * as React from 'react'
import {css} from 'emotion'
import * as ui from './ui_utils'
import {Switch} from 'react-router-dom'

import {version} from './version'

// $ rg -l stories | sed "s,src/\(.*\).tsx,import './\1'," | sort
import './Admin'
import './Bodies'
import './BoxplotWithControls'
import './Center'
import './Domplot'
import './Form'
import './FormAndPlot'
import './FormAndPlotView'
import './KMPlotWithControls'
import './Splash'
import './Vega/Boxplot'
import './Vega/KMPlot'

import {StoryBrowser, useStories} from './ui_utils/stories'
import {MockBackend} from './backend'

import * as backend from './backend'

const classes = {
  View: css({
    margin: 10,
    padding: 10,
    background: '#fff',
    display: 'flex',
  }),
}

export default function Dev() {
  const {stories} = useStories()
  const res = ui.useRoutedTabs([
    ...stories.map(story => ({
      label: story.name || '?',
      path: '/' + (story.name || 'missing_path').replace('/', '-'),
      component: story.component,
      exact: false,
    })),
    {
      label: 'Stories',
      path: '/Stories',
      component: <StoryBrowser />,
    },
  ])
  const {TabbedRoutes, set_tab} = React.useMemo(() => res, [stories.map(st => st.key).join('_')])
  const {tab, Tabs} = res
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
  console.log(stories)
  React.useEffect(() => {
    if (tab) {
      document.title = `encima: ${tab.label}`
    }
  }, [tab && tab.label])

  return (
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
  )
}
