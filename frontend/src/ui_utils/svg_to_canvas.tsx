export function svg_to_canvas(new_svg: SVGElement) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const blob = new Blob([new_svg.outerHTML], {type: 'image/svg+xml;charset=utf-8'})
  const uri = window.URL.createObjectURL(blob)
  const img = new Image()
  img.onload = () => {
    ctx.drawImage(img, 0, 0)
    URL.revokeObjectURL(uri)
    document.body.innerHTML += `<img src="${canvas.toDataURL('image/png')}"/>`
  }
  img.src = uri
}
