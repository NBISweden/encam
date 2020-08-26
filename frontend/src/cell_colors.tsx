const colors: Record<string, string> = {
  CD4: 'rgb(237,175,127)',
  CD8: 'rgb(180,20,4)',
  CD8_Treg: 'rgb(134,72,89)',
  B_cells: 'rgb(236,116,11)',
  NK: 'rgb(246,185,5)',
  CD4_Treg: 'rgb(212,185,118)',
  M1: 'rgb(4,147,123)',
  NKT: 'rgb(140,67,10)',
  M2: 'rgb(100,132,58)',
  'Myeloid cell': 'rgb(119,148,4)',
  Myeloid: 'rgb(119,148,4)',
  iDC: 'rgb(70,105,164)',
  mDC: 'rgb(100,148,202)',
  pDC: 'rgb(147,170,218)',
  Granulocyte: 'rgb(170,108,28)',
  'Gran...': 'rgb(170,108,28)',
}

export const cell_color = (cell: string) => {
  if (!(cell in colors)) {
    colors[cell] = '#dab'
  }
  return colors[cell]
}
