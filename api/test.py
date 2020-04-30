
from database import filter, filter2
import json

example_body = {
  "clinical_stage": [
    "0",
    "I",
    "II",
    "III",
    "IV"
  ],
  "pT_stage": [
    "T0",
    "T1",
    "T2",
    "T3",
    "T4"
  ],
  "pN_stage": [
    "N0",
    "N1",
    "N2"
  ],
  "pM_stage": [
    "M0",
    "M1"
  ],
  "Diff_grade": [
    "high",
    "low",
    "missing"
  ],
  "Neuralinv": [
    "No",
    "Yes",
    "missing"
  ],
  "Vascinv": [
    "No",
    "Yes",
    "missing"
  ],
  "PreOp_treatment_yesno": [
    "No",
    "Yes"
  ],
  "PostOp_type_treatment": [
    "Chemotherapy only",
    "no"
  ],
  "Anatomical_location": {
    "COAD": [
      "Appendix",
      "Ascendens",
      "Caecum",
      "Descendens",
      "Flexura hepatica",
      "Flexura lienalis",
      "Rectum",
      "Sigmoideum",
      "Transversum"
    ],
    "READ": [
      "Appendix",
      "Rectum"
    ]
  },
  "Morphological_type": {
    "COAD": [
      "mucinon-mucinousus",
      "non-mucinous",
      "missing"
    ],
    "READ": [
      "mucinon-mucinousus",
      "non-mucinous",
      "missing"
    ]
  },
  "MSI_ARTUR": {
    "COAD": [
      "MSI",
      "MSS"
    ],
    "READ": [
      "MSI",
      "MSS"
    ]
  },
  "cells": [
    "B_cells",
    "CD4",
    "CD4_Treg",
    "CD8",
    "CD8_Treg",
    "Granulocyte",
    "M1",
    "M2",
    "Myeloid cell",
    "NK",
    "NKT",
    "iDC",
    "mDC",
    "pDC"
  ],
  "tumors": [
    "COAD",
    "BRCA"
  ]
}

def test_impls(ex):
    filter1_to_dict = lambda ex: filter(ex).to_dict(orient='records')
    filter2_to_dict = lambda ex: filter2(ex).to_dict(orient='records')

    c1 = filter1_to_dict(ex)
    c2 = filter2_to_dict(ex)

    print(len(c1), len(c2))

    assert len(c1) == len(c2)

    sort = lambda xs: sorted(xs, key=json.dumps)

    assert sort(c1) == sort(c2)

test_impls(example_body)

def test_clinical_stage():

    ex1 = dict(example_body)
    ex2 = dict(example_body)
    ex12 = dict(example_body)

    ex1['clinical_stage'] = ["I", "II"]
    ex2['clinical_stage'] = ["0", "IV"]
    ex12['clinical_stage'] = ex1['clinical_stage'] + ex2['clinical_stage']

    test_impls(ex1)
    test_impls(ex2)
    test_impls(ex12)

    filter_to_dict = lambda ex: filter2(ex).to_dict(orient='records')

    c1 = filter_to_dict(ex1)
    c2 = filter_to_dict(ex2)
    c12 = filter_to_dict(ex12)

    assert len(c1) + len(c2) == len(c12)

    sort = lambda xs: sorted(xs, key=json.dumps)

    assert sort(c1 + c2) == sort(c12)

test_clinical_stage()

def test_Anatomical_location():

    ex1 = dict(example_body)
    ex2 = dict(example_body)
    ex12 = dict(example_body)

    ex1['tumors'] = ['COAD']
    ex2['tumors'] = ['COAD']
    ex12['tumors'] = ['COAD']

    ex1['Anatomical_location'] = dict(ex1['Anatomical_location'])
    ex2['Anatomical_location'] = dict(ex2['Anatomical_location'])
    ex12['Anatomical_location'] = dict(ex12['Anatomical_location'])

    ex1['Anatomical_location']['COAD'] = [
      "Appendix",
      "Ascendens",
      "Caecum",
    ]
    ex2['Anatomical_location']['COAD'] = [
      "Descendens",
      "Flexura hepatica",
      "Flexura lienalis",
      "Rectum",
      "Sigmoideum",
      "Transversum"
    ]
    ex12['Anatomical_location']['COAD'] = ex1['Anatomical_location']['COAD'] + ex2['Anatomical_location']['COAD']

    test_impls(ex1)
    test_impls(ex2)
    test_impls(ex12)

    filter_to_dict = lambda ex: filter2(ex).to_dict(orient='records')

    c1 = filter_to_dict(ex1)
    c2 = filter_to_dict(ex2)
    c12 = filter_to_dict(ex12)

    print(
        len(c1),
        len(c2),
        len(c1) + len(c2),
        len(c12)
    )

    assert len(c1) + len(c2) == len(c12)

    sort = lambda xs: sorted(xs, key=json.dumps)

    assert sort(c1 + c2) == sort(c12)

test_Anatomical_location()

