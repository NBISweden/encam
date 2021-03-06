/**

  A small replacement for "storybook".

  These stories are defined using the stories function and are visible under
  the /dev route of the page which shows the Dev component.

*/
import React from 'react'

import * as utils from '@app/utils'

export interface BabelSource {
  fileName: string
  columnNumber: number
  lineNumber: number
}

export interface Story extends BabelSource {
  component: React.ReactElement
  name: string
  seq_num: number
  key: string
}

export interface AddFunction {
  (
    tagged_components: Record<string, React.ReactElement> | React.ReactElement,
    ...components: React.ReactElement[]
  ): AddedStories
}

export interface AddedStories {
  wrap(wrap_fun: (elem: React.ReactElement) => React.ReactElement): AddedStories

  name(component_name: string): AddedStories
  tag(tag_name: string): AddedStories

  add: AddFunction
}

interface Counter {
  next(): number
}

const Counter = (): Counter => {
  let c = 0
  return {
    next: () => c++,
  }
}

const unknowns = Counter()

const DummyBabelSource = (): BabelSource => ({
  fileName: `unknown${unknowns.next()}`,
  columnNumber: 0,
  lineNumber: 0,
})

function name_from_component(component: React.ReactElement): string | undefined {
  const {type} = component
  if (type instanceof Function) {
    return type.name
  } else if ((type as any)?.type instanceof Function) {
    return (type as any).type.name
  } else if (typeof type === 'string') {
    return type
  } else {
    console.warn('Exotic component type:', type)
    return undefined
  }
}

function makeStory(component: React.ReactElement, seq_num: number): Story {
  const source: BabelSource = (component as any)._source || DummyBabelSource()
  const key = source.fileName + '[' + seq_num + ']'
  return {
    component,
    seq_num,
    name: name_from_component(component) || key,
    key,
    ...source,
  }
}

export type Modules = Record<string, Story[]>

function AddFunction(counter: Counter, stories: Story[]): AddedStories {
  function go(f: (st: Story) => void) {
    stories.forEach(f)
    return self
  }
  const self: AddedStories = {
    wrap: wrap => go(st => (st.component = wrap(st.component))),
    name: name => go(st => (st.name = name)),
    tag: tag => go(st => (st.name += '/' + tag)),
    add: (c, ...components) => {
      if (!React.isValidElement(c)) {
        Object.entries(c).forEach(([tag, component]) => {
          const tagged_stories: Story[] = []
          AddFunction(counter, tagged_stories).add(component).tag(tag)
          stories.push(...tagged_stories)
        })
        if (components.length >= 1) {
          const [hd, ...tl] = components
          self.add(hd, ...tl)
        }
      } else {
        ;[c, ...components].forEach(component => {
          const story = makeStory(component, counter.next())
          stories.push(story)
        })
      }
      return self
    },
  }
  return self
}

function AddFactory(): [AddFunction, () => Story[]] {
  const all_stories: Story[][] = []
  const counter = Counter()
  const add: AddFunction = (c, ...cs) => {
    const stories: Story[] = []
    all_stories.push(stories)
    return AddFunction(counter, stories).add(c, ...cs)
  }
  return [add, () => all_stories.flat()]
}

export function StoryFactory(init_modules = {} as Modules) {
  const modules = init_modules

  const nudges = new Map<any, () => void>()

  function stories(scoped_add: (add: AddFunction) => void) {
    // if (process.env.NODE_ENV !== 'development') {
    // return
    // }
    const [add, get_stories] = AddFactory()
    scoped_add(add)
    const by_filename = Object.entries(utils.groupBy('fileName', get_stories()))
    if (by_filename.length > 1 && by_filename.some(([file_name]) => !file_name.match(/^unknown/))) {
      console.warn(
        'Components defined in different files:',
        by_filename.map(kv => kv[0])
      )
    }
    by_filename.forEach(([fileName, stories]) => {
      modules[fileName] = stories
    })
    nudges.forEach(k => k())
  }

  function getStories() {
    const stories = Object.values(modules).flat()
    return {stories, modules}
  }

  function useStories() {
    const [ref] = React.useState({})
    const set_nudge = React.useState(0)[1]
    React.useLayoutEffect(() => {
      nudges.set(ref, () => set_nudge(i => ++i))
      return () => void nudges.delete(ref)
    }, [])
    return getStories()
  }

  function StoryBrowser() {
    const {stories} = useStories()
    const [story_key, set_story_key] = React.useState(undefined as undefined | string)
    return (
      <div style={{display: 'flex', flexDirection: 'row'}}>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          {stories.map(story => (
            <button
              key={story.key}
              style={{textAlign: 'left'}}
              onClick={_ => set_story_key(story.key)}>
              {story.name}
            </button>
          ))}
        </div>
        <div>
          {stories
            .filter(story => story.key === story_key)
            .map(story => (
              <React.Fragment key={story.key}>{story.component}</React.Fragment>
            ))}
        </div>
      </div>
    )
  }

  return {stories, useStories, StoryBrowser, getStories}
}

function __stories__() {
  const w = window as any
  const k = '__stories__'
  w[k] = w[k] || {}
  return w[k]
}

const Stories = StoryFactory(__stories__())

export const stories = Stories.stories
export default stories

export const getStories = Stories.getStories
export const useStories = Stories.useStories
export const StoryBrowser = () => Stories.StoryBrowser()
