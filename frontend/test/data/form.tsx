import {Conf} from '../../src/Form'

export const form_test_conf: Conf = {
  cells: [
    "CD4",
    "CD4_Treg",
    "CD8",
    "CD8_Treg",
  ],
  tumor_codes: {
    BRCA: "Breast invasive carcinoma",
    COAD: "Colon adenocarcinoma",
    READ: "Rectum adenocarcinoma",
    MEL: "Melanoma",
  },
  tumor_specific_values: [
    {
      column: "Anatomical_location",
      tumor: "COAD",
      values: [
        "Appendix",
        "Ascendens",
        "Descendens",
        "Rectum",
      ]
    },
    {
      column: "Anatomical_location",
      tumor: "READ",
      values: [
        "Appendix",
        "Rectum"
      ]
    },
    {
      column: "MSI_ARTUR",
      tumor: "READ",
      values: [
        "MSI",
        "MSS"
      ]
    }
  ],
  tumors: [
    "COAD",
    "READ",
    "BRCA",
    "MEL",
  ],
  variant_values: [
    {
      column: "pN_stage",
      values: [
        "N0",
        "N1",
        "N2"
      ]
    },
    {
      column: "Diff_grade",
      values: [
        "high",
        "low",
        "missing"
      ]
    },
    {
      column: "Neuralinv",
      values: [
        "No",
        "Yes",
        "missing"
      ]
    },
  ]
}
