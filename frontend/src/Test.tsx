import * as React from 'react'

const Ctx = React.createContext(0)

function ShowValue() {
  const v = React.useContext(Ctx)
  console.log('Show Value redrawing', v)
  return <span style={{margin: 5}}>
    Value: {React.useContext(Ctx)}
  </span>
}

function Component({children = []}: {children: React.ReactNode}) {
  console.log('Component redrawing')
  return <div>
    Component
    {children}
  </div>
}

export function Test() {
  const [v, set_v] = React.useState(0)
  React.useEffect(() => {
    const t = window.setInterval(() => set_v(u => u + 1), 400)
    return () => window.clearInterval(t)
  }, [])
  return (
    <Ctx.Provider value={v}>
      {React.useMemo(() =>
        <Component>
          <ShowValue/>
        </Component>
      , [])}
    </Ctx.Provider>
  )
}
