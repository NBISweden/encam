// const colors: Record<string, string> = {
const colors = {
  CD4: 'rgb(237,175,127)',
  CD8: 'rgb(180,20,4)',
  CD8_Treg: 'rgb(134,72,89)',
  'CD8 T...': 'rgb(134,72,89)',
  B_cells: 'rgb(236,116,11)',
  NK: 'rgb(246,185,5)',
  CD4_Treg: 'rgb(212,185,118)',
  'CD4_T...': 'rgb(212,185,118)',
  M1: 'rgb(4,147,123)',
  NKT: 'rgb(140,67,10)',
  M2: 'rgb(100,132,58)',
  'Myeloid cell': 'rgb(119,148,4)',
  Myeloid_cell: 'rgb(119,148,4)',
  Myeloid: 'rgb(119,148,4)',
  'Myel...': 'rgb(119,148,4)',
  iDC: 'rgb(70,105,164)',
  mDC: 'rgb(100,148,202)',
  pDC: 'rgb(147,170,218)',
  Granulocyte: 'rgb(170,108,28)',
  'Gran...': 'rgb(170,108,28)',
}

export const cell_color = (cell: string) => {
  if (cell in colors) {
    return colors[cell as keyof typeof colors]
  } else {
    return '#dab'
  }
}

// This is category10 but colours replaced from the cell palette
export const color_scheme = [
  colors.iDC,
  colors.B_cells,
  colors.M2,
  colors.CD8,
  colors['CD8_Treg'],
  colors.NKT,
  colors.CD4,
  colors.pDC,
  colors.Myeloid,
  colors.M1,
]

export const color_scheme_fg = [
  'white', // colors.iDC,
  'black', // colors.B_cells,
  'black', // colors.M2,
  'white', // colors.CD8,
  'white', // colors['CD8_Treg'],
  'white', // colors.NKT,
  'black', // colors.CD4,
  'black', // colors.pDC,
  'black', // colors.Myeloid,
  'black', // colors.M1,
]
