import * as React from 'react'
import {Suspense} from 'react'
import type {default as EmbedInner} from './EmbedInner'

const LazyEmbed = React.lazy(() => import('./EmbedInner'))

export const Embed: typeof EmbedInner = props => (
  <Suspense fallback={<span>Loading plot...</span>}>
    <LazyEmbed {...props} />
  </Suspense>
)
