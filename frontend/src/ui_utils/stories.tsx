import React from 'react'

export interface Story {
  component: React.ReactElement
  // controls?: Record<string, Control>
  wrap?: (component: React.ReactElement) => React.ReactElement
  tag?: string
  name?: string
  key?: string
  module_id?: string
  component_name?: string
  snapshot?: boolean
}

function add_metadata(story: Story | React.ReactElement, module_id: string, seq_id: number): Story {
  if (!('component' in story)) {
    story = {component: story}
  }
  const {tag, component} = story
  const {type} = component
  let component_name: string | undefined
  if (type instanceof Function) {
    component_name = type.name
  } else if ((type as any)?.type instanceof Function) {
    component_name = (type as any).type.name
  } else if (typeof type === 'string') {
    component_name = type
  } else {
    console.warn('Exotic component type:', type)
  }
  let path = []
  if (component_name) {
    path.push(component_name)
  }
  if (tag) {
    path.push(tag)
  }
  if (!path.length) {
    path.push(module_id + '[' + seq_id + ']')
  }
  const name = story.name ?? path.join('/')
  return {
    ...story,
    component: story.wrap ? story.wrap(component) : component,
    key: module_id + '[' + seq_id + ']',
    module_id,
    component_name,
    tag: tag ?? seq_id + '',
    name,
  }
}

let i = 0

function module_id_from_import_meta(import_meta: any) {
  const id = import_meta?.hot?.id
  if (typeof id === 'string') {
    const path = id.split('/').filter(s => s.length && s[0] != '_')
    const joined = path.join('/').replace(/.[tj]sx?$/, '')
    return joined
  } else if (typeof import_meta === 'string') {
    return import_meta
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.error('Not hot import.meta', import_meta)
    }
    return i++ + '?'
  }
}

export type Modules = Record<string, Story[]>

export type NestedArrays<A> = (A | NestedArrays<A>)[]

function flatten<A>(xss: NestedArrays<A>): A[] {
  return xss.flatMap(xs => (Array.isArray(xs) ? flatten(xs) : [xs]))
}

export function StoryFactory(init_modules = {} as Modules) {
  const modules = init_modules

  const nudges = new Map<any, () => void>()

  function stories(import_meta: any, ...stories: NestedArrays<Story | React.ReactElement>) {
    const module_id = module_id_from_import_meta(import_meta)
    modules[module_id] = flatten(stories).map((story, i) => add_metadata(story, module_id, i))
    nudges.forEach(k => k())
  }

  stories.scoped = (mod: Partial<Story>, ...stories: NestedArrays<Partial<Story>>): Story[] => {
    return flatten(stories).map(st => ({component: <span>Component missing</span>, ...mod, ...st}))
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

// console.log('module reload: stories')

/** Graveyard

type Control =
  | { kind: 'oneof', values: any[] }
  | { kind: 'range', min: number, max: number }

const controls = {
  oneof: (...values: any[]): Control => ({ kind: 'oneof', values }),
  range: (min: number, max: number): Control => ({ kind: 'range', min, max }),
}

*/
