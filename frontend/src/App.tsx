import * as React from 'react'
import {Suspense} from 'react'
import {Switch, Route, Link} from 'react-router-dom'

import {CssBaseline} from '@material-ui/core'
import {css} from 'emotion'

import {GlobalStyle} from './GlobalStyle'
import {version} from './version'

import {Main, WithMainTheme} from './Main'

const LazyDev = React.lazy(() => import('./Dev'))
const LazyAdmin = React.lazy(() => import('./Admin'))

import {WithBackendContent} from './Content'

export function App() {
  return (
    <WithMainTheme>
      <CssBaseline />
      <GlobalStyle />
      <Switch>
        <Route path="/admin">
          <Suspense fallback={<span>Loading admin...</span>}>
            <LazyAdmin />
          </Suspense>
        </Route>
        <Route path="/dev">
          <Suspense fallback={<span>Loading dev...</span>}>
            <LazyDev />
          </Suspense>
        </Route>
        <Route path="/staging">
          <WithBackendContent url="content.staging.json">
            <Main version={<span style={{float: 'right'}}>version: staging</span>} />
          </WithBackendContent>
        </Route>
        <Route path="/">
          <WithBackendContent url="content.json">
            <Main
              version={
                <>
                  <Link style={{paddingRight: '1em'}} to="/admin">
                    admin
                  </Link>
                  <Link to="/dev">dev</Link>
                </>
              }
            />
          </WithBackendContent>
        </Route>
      </Switch>
    </WithMainTheme>
  )
}
