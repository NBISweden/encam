import React from 'react'

export interface Story {
  component: React.ReactElement
  // controls?: Record<string, Control>
  name: string
  module_id: string
  snap: boolean
  skip: boolean
  only: boolean
  seq_num: number
  key: string
}

export type TestApi = typeof import('@testing-library/react')

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

  test(test_name: string, script: (q: TestApi) => Promise<void>): AddedStories
  snap(): AddedStories
  only(): AddedStories
  skip(): AddedStories

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

function makeStory(component: React.ReactElement, module_id: string, seq_num: number): Story {
  const key = module_id + '[' + seq_num + ']'
  return {
    component,
    seq_num,
    module_id,
    name: name_from_component(component) || key,
    snap: false,
    skip: false,
    only: false,
    key,
  }
}

const unknowns = Counter()

function module_id_from_import_meta(import_meta: any): string {
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
    return `unknown_module_${unknowns.next()}`
  }
}

export type Modules = Record<string, Story[]>

function AddFunction(module_id: string, counter: Counter, stories: Story[]): AddedStories {
  function go(f: (st: Story) => void) {
    stories.forEach(f)
    return self
  }
  const self: AddedStories = {
    wrap: wrap => go(st => (st.component = wrap(st.component))),
    name: name => go(st => (st.name = name)),
    tag: tag => go(st => (st.name += '/' + tag)),
    test() {
      throw new Error('test not implemented')
    },
    snap: () => go(st => (st.snap = true)),
    only: () => go(st => (st.only = true)),
    skip: () => go(st => (st.skip = true)),
    add: (c, ...components) => {
      if (!React.isValidElement(c)) {
        Object.entries(c).forEach(([tag, component]) => {
          const tagged_stories: Story[] = []
          AddFunction(module_id, counter, tagged_stories).add(component).tag(tag)
          stories.push(...tagged_stories)
        })
        if (components.length >= 1) {
          const [hd, ...tl] = components
          self.add(hd, ...tl)
        }
      } else {
        ;[c, ...components].forEach(component => {
          const story = makeStory(component, module_id, counter.next())
          stories.push(story)
        })
      }
      return self
    },
  }
  return self
}

function AddFactory(module_id: string): [AddFunction, () => Story[]] {
  const all_stories: Story[][] = []
  const counter = Counter()
  const add: AddFunction = (c, ...cs) => {
    const stories: Story[] = []
    all_stories.push(stories)
    return AddFunction(module_id, counter, stories).add(c, ...cs)
  }
  return [add, () => all_stories.flat()]
}

export function StoryFactory(init_modules = {} as Modules) {
  const modules = init_modules

  const nudges = new Map<any, () => void>()

  function stories(import_meta: any, add_cb: (add: AddFunction) => void) {
    const module_id = module_id_from_import_meta(import_meta)
    const [add, get_stories] = AddFactory(module_id)
    add_cb(add)
    modules[module_id] = get_stories()
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
