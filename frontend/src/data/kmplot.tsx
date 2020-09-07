import * as ui from '../ui_utils'
import * as utils from '../utils'
import type {KMRow} from '../Vega/KMPlot'
import type {Survival} from '../KMPlotWithControls'

const points = utils
  .enumTo(4)
  .map(g => g + 1)
  .flatMap(group =>
    utils.enumTo(460).map(t => ({
      group,
      time: t,
      upper: 1 - (0.9 * t) / 460 / group,
      fit: 1 - (0.8 * t) / 460 / group,
      lower: 1 - (0.55 * t) / 460 / group,
    }))
  )

export const survival: Survival = {
  points,
  live_points: points.filter((_, i) => i % 37 == 0),
  log_rank: {
    test_statistic_logrank: 2.3392174425317878,
    p_logrank: 0.12615291394526454,
  },
  cox_regression: {
    // coef: 0.8679686436827134,
    // lower: 0.7269015900256959,
    // upper: 1.0364120491052684,
    p: 0.11764257950548528,
  },
}

export function make_points(num_groups: number) {
  return survival.points.filter(p => Math.random() > 0.75 && p.group <= num_groups)
}

export const filter = {
  clinical_stage: ['0', 'I', 'II', 'III', 'IV'],
  pT_stage: ['T0', 'T1', 'T2', 'T3', 'T4'],
  pN_stage: ['N0', 'N1', 'N2'],
  pM_stage: ['M0', 'M1'],
  Diff_grade: ['high', 'low', 'missing'],
  Neuralinv: ['No', 'Yes', 'missing'],
  Vascinv: ['No', 'Yes', 'missing'],
  PreOp_treatment_yesno: ['No', 'Yes'],
  PostOp_type_treatment: ['Chemotherapy only', 'no'],
  Anatomical_location: {
    COAD: [
      'Appendix',
      'Ascendens',
      'Caecum',
      'Descendens',
      'Flexura hepatica',
      'Flexura lienalis',
      'Rectum',
      'Sigmoideum',
      'Transversum',
    ],
    READ: ['Appendix', 'Rectum'],
  },
  Morphological_type: {
    COAD: ['mucinon-mucinousus', 'non-mucinous', 'missing'],
    READ: ['mucinon-mucinousus', 'non-mucinous', 'missing'],
  },
  MSI_ARTUR: {
    COAD: ['MSI', 'MSS'],
    READ: ['MSI', 'MSS'],
  },
  cell: 'B_cells',
  tumor: 'COAD',
  location: 'TUMOR',
  num_groups: 2,
  tumors: ['COAD'],
}

export const expression = [
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0.8,
  1.0,
  1.0,
  1.0,
  1.0,
  1.0,
  1.1,
  1.1,
  1.2,
  1.2,
  1.2,
  1.2,
  2.9,
  3.0,
  3.1,
  3.2,
  35.409889955455704,
  35.409889955455704,
  35.409889955455704,
  100.501846525461,
  100.501846525461,
  100.501846525461,
  424.18447500676905,
]

export const request = async (endpoint: string, args: any) => {
  if (endpoint.includes('expression')) {
    await ui.sleep(100)
    return expression.filter(() => Math.random() > 0.1)
  } else {
    await ui.sleep(200)
    return {
      ...survival,
      points: make_points(args.num_groups),
    }
  }
}
