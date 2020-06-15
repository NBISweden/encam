from database import filter, filter2, uniq
import server
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

example_body2 = {
  "clinical_stage": [
    "IV"
  ],
  "pT_stage": [
    "T0",
    "T3",
    "T4"
  ],
  "pN_stage": [
    "N0",
    "N2"
  ],
  "pM_stage": [
    "M1"
  ],
  "Diff_grade": [
    "high",
    "missing"
  ],
  "Neuralinv": [
    "No",
    "missing"
  ],
  "Vascinv": [
    "No",
    "Yes",
  ],
  "PreOp_treatment_yesno": [
    "No",
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
    "CD4",
    "CD4_Treg"
  ],
  "tumors": [
    "COAD",
    "READ"
  ]
}

sort = lambda xs: sorted(xs, key=json.dumps)
filter_to_dict = lambda ex: filter(ex).to_dict(orient='records')
filter2_to_dict = lambda ex: filter2(ex).to_dict(orient='records')

# Test the two different filter methods
def test_impls(ex):
    filter1_to_dict = lambda ex: filter(ex).to_dict(orient='records')
    filter2_to_dict = lambda ex: filter2(ex).to_dict(orient='records')

    c1 = filter1_to_dict(ex)
    c2 = filter2_to_dict(ex)

    assert len(c1) == len(c2)

    assert sort(c1) == sort(c2)

test_impls(example_body)

# Test filtering using clinical stage subgroups
# Assert that the sum of the results for the subgroups 
# is equal to the amount of results for the group
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

    c1 = filter_to_dict(ex1)
    c2 = filter_to_dict(ex2)
    c12 = filter_to_dict(ex12)

    assert len(c1) + len(c2) == len(c12)

    assert sort(c1 + c2) == sort(c12)

test_clinical_stage()

# Test filtering using anatomical location subgroups
# Assert that the sum of the results for the subgroups 
# is equal to the amount of results for the group
def test_anatomical_location():

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

    c1 = filter_to_dict(ex1)
    c2 = filter_to_dict(ex2)
    c12 = filter_to_dict(ex12)

    assert len(c1) + len(c2) == len(c12)

    assert sort(c1 + c2) == sort(c12)

test_anatomical_location()

# Test filtering using pt stage subgroups
# Assert that the sum of the results for the subgroups 
# is equal to the amount of results for the group
def test_pt_stage():

    ex1 = dict(example_body)
    ex2 = dict(example_body)
    ex12 = dict(example_body)

    ex1['pT_stage'] = ['T0', 'T1', 'T2']
    ex2['pT_stage'] = ['T3', 'T4']
    ex12['pT_stage'] = ex1['pT_stage']+ ex2['pT_stage']

    test_impls(ex1)
    test_impls(ex2)
    test_impls(ex12)

    c1 = filter_to_dict(ex1)
    c2 = filter_to_dict(ex2)
    c12 = filter_to_dict(ex12)

    assert len(c1) + len(c2) == len(c12)

    assert sort(c1 + c2) == sort(c12)

test_pt_stage()

# Test filtering using pn stage subgroups
# Assert that the sum of the results for the subgroups 
# is equal to the amount of results for the group
def test_pn_stage():

    ex1 = dict(example_body)
    ex2 = dict(example_body)
    ex12 = dict(example_body)

    ex1['pN_stage'] = ['N0']
    ex2['pN_stage'] = ['N1']
    ex12['pN_stage'] = ex1['pN_stage']+ ex2['pN_stage']

    test_impls(ex1)
    test_impls(ex2)
    test_impls(ex12)


    c1 = filter_to_dict(ex1)
    c2 = filter_to_dict(ex2)
    c12 = filter_to_dict(ex12)

    assert len(c1) + len(c2) == len(c12)

    assert sort(c1 + c2) == sort(c12)

test_pn_stage()

# Test filtering using pm stage subgroups
# Assert that the sum of the results for the subgroups 
# is equal to the amount of results for the group
def test_pm_stage():

    ex1 = dict(example_body)
    ex2 = dict(example_body)
    ex12 = dict(example_body)

    ex1['pM_stage'] = ['M0']
    ex2['pM_stage'] = ['M1']
    ex12['pM_stage'] = ex1['pM_stage']+ ex2['pM_stage']

    test_impls(ex1)
    test_impls(ex2)
    test_impls(ex12)

    c1 = filter_to_dict(ex1)
    c2 = filter_to_dict(ex2)
    c12 = filter_to_dict(ex12)

    assert len(c1) + len(c2) == len(c12)

    assert sort(c1 + c2) == sort(c12)

test_pm_stage()


# Test the number of results returned with current filtering
def test_results_number():
    ex = dict(example_body)
    
    c = filter2_to_dict(ex)

    assert len(c) == 27580

    # Filter out cell types
    ex['cells'] = ['CD4_Treg', 'CD4']
    c = filter2_to_dict(ex)

    assert len(c) == 3940

    # Using second example data
    ex = dict(example_body2)
    c = filter2_to_dict(ex)

    assert len(c) == 124

test_results_number()