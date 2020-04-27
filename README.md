# encam

Encyclopedia of Cancer Microenvironment

## Frontend-backend API sketch for box plots

```javascript
input:

    [
       {
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
        "cells": [],
        "tumors": [
          "COAD",
          "MEL"
        ]
      }
      , possibly more objects
    ]

response:

    [
        [
            { "tumor": "MEL", "cell": "CD4", "location": "STROMA", "expression": 4.92878303672137 },
            { "tumor": "MEL", "cell": "CD4", "location": "STROMA", "expression": 3.48051492517431 },
            { "tumor": "COAD", "cell": "CD4", "location": "STROMA", "expression": 4.64919217514609 },
            { "tumor": "COAD", "cell": "CD4", "location": "TUMOR", "expression": 3.50456795234169 },
            { "tumor": "COAD", "cell": "CD8", "location": "STROMA", "expression": 2.0 },
            ...
        ]
        , one array reply for each input object
    ]
```

