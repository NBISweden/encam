import * as React from 'react'

async function request_by_fetch(endpoint: string, body?: any) {
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
  return await resp.json()
}

const Backend = React.createContext(request_by_fetch)

export function useRequestFn(): typeof request_by_fetch {
  return React.useContext(Backend)
}

export function useRequest<A = any>(endpoint: string, argument?: any) {
  const [resp, set_resp] = React.useState(undefined as undefined | A)
  const request = useRequestFn()
  React.useEffect(() => {
    request(endpoint, argument).then(set_resp)
  }, [])
  return resp
}

export function MockBackend(props: {request: typeof request_by_fetch; children: React.ReactNode}) {
  return <Backend.Provider value={props.request}>{props.children}</Backend.Provider>
}
