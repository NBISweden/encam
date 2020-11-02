import React, { Suspense } from 'react'

import type * as VL from 'vega-lite'
import type * as V from 'vega'
import type vegaTooltip from 'vega-tooltip'

const EmbedInner = React.lazy(() => import('./EmbedInner'))

export const Embed: typeof EmbedInner = props => <Suspense fallback={<div>Loading...</div>} >
  <EmbedInner {...props} />
</Suspense>
