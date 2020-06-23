import * as React from 'react'

export async function request(endpoint: string, body?: any) {
  const init = body ? {
    body: JSON.stringify(body),
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  } : undefined
  const resp = await fetch(window.location.origin + '/api/' + endpoint, init)
  return await resp.json()
}

export function make_useRequest(the_request: typeof request) {
  return function useRequest(endpoint: string, argument?: any) {
    let [resp, set_resp] = React.useState(undefined as any)
    React.useEffect(() => {
      the_request(endpoint, argument).then(set_resp)
    }, [])
    // TODO: handle error
    return resp
  }
}

export const useRequest = make_useRequest(request)

export function make_backend(the_request: typeof request) {
  return {
    request: the_request,
    useRequest: make_useRequest(the_request)
  }
}

export const backend = make_backend(request)

