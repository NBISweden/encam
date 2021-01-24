/**

  I wrote this for theherdbook's tabs. It's used here only for the Dev view.

*/
import * as React from 'react'
import * as Router from 'react-router-dom'
import {Route} from 'react-router-dom'
import {Tab, Tabs} from '@material-ui/core'

export interface MatchProps {
  path?: string
  exact?: boolean
  strict?: boolean
  sensitive?: boolean
}

export interface RoutedTab extends MatchProps {
  label: string
  component?: React.ReactNode
  visible?: boolean
  icon?: React.ReactElement
  on_click?: () => void
}

type Arg0<T> = T extends (a: infer A) => any ? A : never

export function useRoutedTabs(
  routed_tabs: RoutedTab[],
  options?: Partial<{autoselect_first: boolean}>
) {
  const history = Router.useHistory()
  const url = Router.useRouteMatch().url.replace(/\/$/, '')

  const matchprops = (tab: RoutedTab): MatchProps => {
    const {path, exact, strict, sensitive} = tab
    return {path: url + path, exact, strict, sensitive}
  }

  const location = Router.useLocation()
  const tab_index = routed_tabs.findIndex(tab =>
    Router.matchPath(location.pathname, matchprops(tab))
  )

  const set_tab = (index: number | ((index: number, num_tabs: number) => number)) => {
    const next_index = typeof index == 'function' ? index(tab_index, routed_tabs.length) : index
    const tab = routed_tabs[next_index]
    if (tab.on_click) {
      tab.on_click()
    }
    if (tab.path) {
      history.push(url + tab.path)
    }
  }

  if (tab_index == -1) {
    if (options && options.autoselect_first && routed_tabs.length) {
      set_tab(0)
    } else {
      console.warn('Route', location.pathname, 'has no corresponding tab from', url)
    }
  }

  return {
    Tabs: (props?: Partial<Arg0<typeof Tabs>>) => (
      <Tabs
        indicatorColor="primary"
        textColor="primary"
        {...props}
        value={tab_index}
        onChange={(_, index) => set_tab(index)}>
        {routed_tabs.map((tab, i) => (
          <Tab
            key={i}
            icon={tab.icon}
            label={tab.label}
            style={{display: tab.visible === false ? 'none' : undefined}}
          />
        ))}
      </Tabs>
    ),
    TabbedRoutes: routed_tabs.map(
      (tab, i) =>
        tab.path &&
        tab.component && (
          <Route {...matchprops(tab)} key={i}>
            {tab.component}
          </Route>
        )
    ),
    tab_index,
    tab: routed_tabs[tab_index],
    set_tab: set_tab,
  }
}

function Inner(props: {children: (params: Record<string, string>) => React.ReactNode}) {
  const params = Router.useParams()
  return <>{props.children(params)}</>
}

export function Routed(props: {
  path: string
  children: (params: Record<string, string>) => React.ReactNode
}) {
  return (
    <Route path={props.path}>
      <Inner>{props.children}</Inner>
    </Route>
  )
}
