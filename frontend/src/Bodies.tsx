import * as React from 'react'

import * as utils from './utils'

import center from './img/center-trimmed.svg'

function download(data: string, filename: string, type: string) {
  // https://stackoverflow.com/questions/13405129/javascript-create-and-save-file
  const file = new Blob([data], {type})
  const a = document.createElement('a')
  const url = URL.createObjectURL(file)
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }, 0)
}

function bbox(e: any) {
  const rect = (e as SVGGElement | SVGPathElement).getBBox()
  return {
    top: rect.y,
    bottom: rect.y + rect.height,
    left: rect.x,
    right: rect.x + rect.width,
    width: rect.width,
    height: rect.height,
  }
}

type Box = ReturnType<typeof bbox>

function dist(x: number, y: number, b: Box) {
  const {min, abs} = Math
  const [x1, x2] = [b.left, b.right]
  const [y1, y2] = [b.top, b.bottom]
  return min(abs(x1 - x), abs(x2 - x)) + min(abs(y1 - y), abs(y2 - y))
}

const within = (lo: number, x: number, hi: number) => lo <= x && x <= hi

function measure(svg: SVGSVGElement, div: HTMLDivElement) {
  const D = {} as Record<string, Box>
  div.innerHTML = ''
  let circles = ''
  let cmd = ''
  for (let e of Array.from(svg.querySelectorAll('g[id]'))) {
    if (e.id.match(/^g\d+$/)) {
      continue
    }
    const g = e.cloneNode(false) as SVGGElement
    Array.from(e.children).forEach(ch => g.append(ch))
    g.removeAttribute('id')
    e.removeAttribute('clip-path')
    e.removeAttribute('transform')
    e.append(g)
    const d = (D[e.id] = bbox(e))
    const urls = []
    const new_svg = svg.cloneNode() as SVGSVGElement
    for (let c of Array.from(e.querySelectorAll('*'))) {
      for (let a of Array.from(c.attributes)) {
        const m = a.nodeValue?.match(/^url\(#(.*)\)$/)
        if (m) {
          urls.push(m[1])
        }
      }
    }
    new_svg.setAttribute('viewBox', `${d.left} ${d.top} ${d.width} ${d.height}`)
    new_svg.setAttribute('width', d.width + '')
    new_svg.setAttribute('height', d.height + '')
    const ec = e.cloneNode(true) as SVGElement
    new_svg.append(ec)
    for (let url of urls) {
      new_svg.append(svg.getElementById(url).cloneNode(true))
    }
    cmd += 'echo -e ' + JSON.stringify(new_svg.outerHTML) + ' > ' + e.id + '.svg\n'
    new_svg.innerHTML = new_svg.innerHTML.replace(/center-/g, e.id + '_')
    div.append(new_svg)
  }
  const M = [] as any[]
  for (let e of Array.from(svg.querySelectorAll('path[id]'))) {
    console.log(e.id)
    const d = bbox(e)
    const [_, x1, y1] = (e.getAttribute('d').match(/^m([\d.]*) ([\d.]*)/) as any) as number[]
    const x2 = [d.left, d.right].sort(utils.by(p => Math.abs(p - x1)))[1]
    const y2 = [d.top, d.bottom].sort(utils.by(p => Math.abs(p - y1)))[1]
    const r = D.bodies
    const p1 = [x1, y1]
    const p2 = [x2, y2]
    const [[sx, sy], [tx, ty]] = within(r.left, x1, r.right) ? [p1, p2] : [p2, p1]
    // console.log(e.id, sx, sy, d, r)
    circles += `
      <circle cx="${sx}" cy="${sy}" r="1"/>
      <circle cx="${tx}" cy="${ty}" r="2"/>
    `
    const [[organ_id, organ_box]] = Object.entries(D).sort(utils.by(([k, v]) => dist(tx, ty, v)))
    const bodies_pos = {x: sx - r.left, y: sy - r.top}
    const organ_pos = {x: tx - organ_box.left, y: ty - organ_box.top}
    const m = {
      bodies: {x: bodies_pos.x / r.width, y: bodies_pos.y / r.height},
      organ: {x: organ_pos.x / organ_box.width, y: organ_pos.y / organ_box.height},
      id: organ_id,
    }
    M.push(m)
  }

  svg.innerHTML += circles

  const round = (d: any) =>
    utils.traverse(d, x => (typeof x === 'number' ? Math.round(x * 1000) / 1000 : x))
  console.log(JSON.stringify(round(M)))

  // console.log(cmd)
  // download(cmd, 'cmd.sh', 'text/plain')
}

export function Bodies() {
  const [ref, set_ref] = React.useState(null as null | HTMLDivElement)
  const [ref2, set_ref2] = React.useState(null as null | HTMLDivElement)
  React.useEffect(() => {
    fetch(center).then(async resp => {
      const str = await resp.text()
      if (ref && ref2) {
        ref.innerHTML = str
        const svg = ref.querySelector('svg')
        svg && measure(svg, ref2)
      }
    })
  }, [center, ref, ref2])
  return (
    <>
      <div ref={set_ref} />
      <div ref={set_ref2} />
    </>
  )
}

import stories from '@app/ui_utils/stories'

stories(import.meta, {
  snapshot: false,
  component: <Bodies />,
})
