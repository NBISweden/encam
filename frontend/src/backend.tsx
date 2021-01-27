import * as React from 'react'

const mem: Record<string, any> = {
  configuration: null,
}

const c = console

async function request_by_fetch(endpoint: string, body?: any) {
  if (mem[endpoint]) {
    return mem[endpoint]
  }
  body && c.log(body)
  const init = body
    ? {
        body: JSON.stringify(body),
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    : undefined
  const resp = await fetch(window.location.origin + '/api/' + endpoint, init)
  if (resp.ok) {
    const res = await resp.json()
    if (mem[endpoint] === null) {
      mem[endpoint] = res
    }
    return res
  } else {
    throw new Error(resp.url + ' ' + resp.status + ' ' + resp.statusText)
  }
}

const Backend = React.createContext(request_by_fetch)

export type RequestFn = typeof request_by_fetch

export function useRequestFn(): RequestFn {
  return React.useContext(Backend)
}

export function useRequest<A = any>(endpoint: string, argument?: any) {
  const [resp, set_resp] = React.useState(undefined as undefined | A)
  const request = useRequestFn()
  React.useLayoutEffect(() => {
    request(endpoint, argument)
      .then(set_resp)
      .catch(e => console.error(e))
  }, [])
  return resp
}

export function MockBackend(props: {request: typeof request_by_fetch; children: React.ReactNode}) {
  return <Backend.Provider value={props.request}>{props.children}</Backend.Provider>
}

export function mock(
  request: typeof request_by_fetch | Promise<{default: typeof request_by_fetch}>
) {
  const req: typeof request_by_fetch = async (...args) => {
    if (request instanceof Promise) {
      const m = await request
      return m.default(...args)
    } else {
      return request(...args)
    }
  }
  return (children: React.ReactNode) => <MockBackend request={req}>{children}</MockBackend>
}
