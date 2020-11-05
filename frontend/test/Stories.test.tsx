import React from 'react'

const normalize_names_plugin = {
  test: (x: any) => typeof x === 'string',
  serialize: (res: any) => {
    return JSON.stringify(
      res
        .replace(/(mui|root)-\d+/g, '$1-')
        .replace(/((WithStyles|makeStyles|Private)[()\w-]+)-\d+/g, '$1-')
    ).replace(/\\n/g, '\n')
  },
}

expect.addSnapshotSerializer(normalize_names_plugin)

// import '@app/A'
// import '@app/B'

import '@app/Bodies'
import '@app/Center'

// no snaps in these, KM is not deterministic :\
import '@app/FormAndPlot'
import '@app/KMPlotWithControls'
import '@app/Vega/KMPlot'

import '@app/Splash'
import '@app/Domplot'
import '@app/Form'
import '@app/FormAndPlotView'
import '@app/BoxplotWithControls'
import '@app/Vega/Boxplot'

import {MockBackend} from '@app/backend'

import {getStories} from '@app/ui_utils/stories'

import renderer from 'react-test-renderer'

import * as q from '@testing-library/react'
import {act, render, fireEvent} from '@testing-library/react'

getStories().stories.map(story => {
  false &&
    story.tests.forEach(T => {
      describe(story.name, () => {
        test(T.test_name, async () => {
          const node = (
            <MockBackend
              request={async () => {
                throw new Error('No backend when testing ' + JSON.stringify(story))
              }}>
              {story.component}
            </MockBackend>
          )

          render(node)

          await act(async () => {})

          await T.script(expect, q)

          // expect(N.container).toMatchSnapshot()
        })
      })
    })
  story.snap === false ||
    describe(story.name, () => {
      test(story.name + ' renderer', async () => {
        const node = (
          <MockBackend
            request={async () => {
              throw new Error('No backend when testing ' + JSON.stringify(story))
            }}>
            {story.component}
          </MockBackend>
        )

        const N = renderer.create(node)

        await renderer.act(async () => {
          N.update(node)
        })

        expect(N.toJSON()).toMatchSnapshot()
      })
      test(story.name + ' render', async () => {
        const node = (
          <MockBackend
            request={async () => {
              throw new Error('No backend when testing ' + JSON.stringify(story))
            }}>
            {story.component}
          </MockBackend>
        )

        const N = render(node)

        await act(async () => {})

        expect(N.container).toMatchSnapshot()
      })
    })
})
