import * as React from 'react'

declare const process: {env: {NODE_ENV: string}}

export const backend_url = process.env.NODE_ENV === 'development'
  ? 'http://localhost:8080/'
  : '/'

export async function request(endpoint: string, body?: any) {
  const init = body ? {
    body: JSON.stringify(body),
    method: 'POST',
    mode: 'cors',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  } : undefined
  const resp = await fetch(backend_url + endpoint, init)
  return await resp.json()
}

export function useRequest(endpoint: string, argument?: any) {
  let [resp, set_resp] = React.useState(undefined as any)
  React.useEffect(() => {
    request(endpoint, argument).then(set_resp)
  }, [])
  // TODO: handle error
  return resp
}
