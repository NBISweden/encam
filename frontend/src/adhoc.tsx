/**

  Ad-hoc preferences to be propagated throughout the code base.

*/

/** Artur's preferred cell order */
export const cellOrder = [
  'CD4',
  'CD4_Treg',
  'CD8',
  'CD8_Treg',
  'B_cells',
  'NK',
  'NKT',
  'M1',
  'M2',
  'Myeloid cell',
  'Myeloid_cell',
  'iDC',
  'mDC',
  'pDC',
  'Granulocyte',
]

/** Cells with underscores in names */
export const cells = cellOrder.filter(cell => !cell.match(/ /))

/** Sort tumors alphabetically */
export function sort_tumors(tumors: string[]): string[] {
  return tumors.slice().sort()
}

/** Sort an array of cell names in Artur's favorite order

  sort_cells(['B_cells', 'CD8_Treg', 'Granulocyte', 'Myeloid_cell'])
   // => ['CD8_Treg', 'B_cells', 'Myeloid_cell', 'Granulocyte']

  Unknown cells are put last:

  sort_cells(['CD8', 'CD404', 'CD4'])
   // => ['CD4', 'CD8', 'CD404']

*/
export function sort_cells(cells: string[]): string[] {
  return [
    ...cellOrder.filter(cell => cells.includes(cell)),
    ...cells.filter(cell => !cellOrder.includes(cell)),
  ]
}

const cell_colors = {
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
  if (cell in cell_colors) {
    return cell_colors[cell as keyof typeof cell_colors]
  } else {
    return '#dab'
  }
}

/** This is category10 but colours replaced from the cell palette */
export const color_scheme = [
  cell_colors.iDC,
  cell_colors.B_cells,
  cell_colors.M2,
  cell_colors.CD8,
  cell_colors['CD8_Treg'],
  cell_colors.NKT,
  cell_colors.CD4,
  cell_colors.pDC,
  cell_colors.Myeloid,
  cell_colors.M1,
]

export const color_scheme_fg = [
  'white', // iDC,
  'black', // B_cells,
  'black', // M2,
  'white', // CD8,
  'white', // 'CD8_Treg'
  'white', // NKT,
  'black', // CD4,
  'black', // pDC,
  'black', // Myeloid,
  'black', // M1,
]

/**

  pretty('CD4_Treg') // => 'CD4 Treg'
  pretty('myeloid') // => 'Myeloid'
  pretty('iDC') // => 'iDC'
  pretty(3) // => '3'
  pretty('Anatomical_location') // => 'Anatomical location'

  Some column names for the form gets improved:

  pretty('pN_stage') // => 'N stage'
  pretty('pn_stage') // => 'Pn stage'
  pretty('PreOp_treatment_yesno') // => 'PreOp treatment'
  pretty('PostOp_type_treatment') // => 'PostOp treatment'
  pretty('Morphological_type') // => 'Morphological type'

  There are also completely ad-hoc rules:

  pretty('MSI_ARTUR') // => 'MSI status'

*/
export function pretty(s: string | number): string {
  if (typeof s === 'number') {
    return s + ''
  }
  const renames: Record<string, string> = {
    MSI_ARTUR: 'MSI status',
  }
  if (renames[s]) {
    return renames[s]
  }
  s = s
    .replace(/_/g, ' ')
    .replace(/\byesno\b/g, ' ')
    .replace(/\btype treatment\b/g, 'treatment')
    .replace(/^p(?=[A-Z])/, '')
    .replace(/ +/g, ' ')
    .trim()
  if (!s) {
    return ''
  }
  const s2 = s.replace('_', ' ')
  if (s2.toLowerCase() == s2) {
    return Aa(s2)
  } else {
    return s2
  }
}

/** Aa('boBBo') // => 'Bobbo' */
function Aa(s: string): string {
  return s[0].toUpperCase() + s.slice(1).toLowerCase()
}
