/**

  Embeds a Vega plot in React. This is done in two steps and this
  is the first/outer step which lazily loads the Vega library
  since it is so big.

*/
import * as React from 'react'
import {Suspense} from 'react'
import type {default as EmbedInner} from './EmbedInner'

const LazyEmbed = React.lazy(() => import('./EmbedInner'))

export const Embed: typeof EmbedInner = props => (
  <Suspense fallback={<span>Loading plot...</span>}>
    <LazyEmbed {...props} />
  </Suspense>
)
