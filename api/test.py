from database import filter, filter2, uniq
import server
import json

from copy import deepcopy

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
    c1 = filter_to_dict(ex)
    c2 = filter2_to_dict(ex)

    assert len(c1) == len(c2)

    assert sort(c1) == sort(c2)

test_impls(example_body)
test_impls(example_body2)

# Test filtering using clinical stage subgroups
# Assert that the sum of the results for the subgroups
# is equal to the amount of results for the group
def test_clinical_stage(ex):

    ex1 = deepcopy(ex)
    ex2 = deepcopy(ex)
    ex12 = deepcopy(ex)

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

test_clinical_stage(example_body)
test_clinical_stage(example_body2)

# Test filtering using anatomical location subgroups
# Assert that the sum of the results for the subgroups
# is equal to the amount of results for the group
def test_anatomical_location(ex):

    ex1 = deepcopy(ex)
    ex2 = deepcopy(ex)
    ex12 = deepcopy(ex)

    ex1['tumors'] = ['COAD']
    ex2['tumors'] = ['COAD']
    ex12['tumors'] = ['COAD']

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

test_anatomical_location(example_body)
test_anatomical_location(example_body2)

# Test filtering using pt stage subgroups
# Assert that the sum of the results for the subgroups
# is equal to the amount of results for the group
def test_pt_stage(ex):

    ex1 = deepcopy(ex)
    ex2 = deepcopy(ex)
    ex12 = deepcopy(ex)

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

test_pt_stage(example_body)
test_pt_stage(example_body2)

# Test filtering using pn stage subgroups
# Assert that the sum of the results for the subgroups
# is equal to the amount of results for the group
def test_pn_stage(ex):

    ex1 = deepcopy(ex)
    ex2 = deepcopy(ex)
    ex12 = deepcopy(ex)

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

test_pn_stage(example_body)
test_pn_stage(example_body2)

# Test filtering using pm stage subgroups
# Assert that the sum of the results for the subgroups
# is equal to the amount of results for the group
def test_pm_stage(ex):

    ex1 = deepcopy(ex)
    ex2 = deepcopy(ex)
    ex12 = deepcopy(ex)

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

test_pm_stage(example_body)
test_pm_stage(example_body2)


# Test the number of results returned with current filtering
def test_results_number():
    ex = deepcopy(example_body)

    c = filter2_to_dict(ex)
    
    assert len(c) == 35532

    # Filter out cell types
    ex['cells'] = ['CD4_Treg', 'CD4']
    c = filter2_to_dict(ex)
    
    assert len(c) == 5076

    # Using second example data
    ex = deepcopy(example_body2)
    c = filter2_to_dict(ex)

    assert len(c) == 128

test_results_number()


import pandas as pd
import database as db
from collections import Counter

def test_binning(values, bin_sizes):
    bin_sizes = [s for s in bin_sizes if s != 0]
    data = {'T-cells': values}
    df = pd.DataFrame(data=data)
    res = db.binning(df, 'T-cells', bin_sizes)
    res_sizes = Counter(res)
    assert len(res_sizes) == len(bin_sizes)
    for i, bin_size in enumerate(bin_sizes):
        assert res_sizes[i+1] == bin_size


test_binning([0,100,200,300,400,500],[2,1,3])
test_binning([0,0,200,300,400,500],[2,1,3])
test_binning([0,0,200,300,300,300],[2,1,3])

test_binning([0,100,200,300,400,500],[4,1,1])
test_binning([0,100,200,300,400,500],[1,4,1])
test_binning([0,100,200,300,400,500],[1,1,4])

test_binning([0,100,200,300,400,500],[2,0,4])

try:
    test_binning([0,0,0,100,200,300],[2,2,2])
except AssertionError as e:
    pass
else:
    raise RuntimeError("Should fail, group sizes not on boundary")
