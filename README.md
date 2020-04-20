# encam

Encyclopedia of Cancer Microenvironment

## Frontend-backend API sketch for box plots

```javascript
input:

    [
        {
            "Tumor_type": ["COAD", "MEL"],
            "Cells": ["CD4", "CD4_Treg", ... and all of them ...],
            "pT stage": ["T0", "T1"],
            ...pN stage, pM stage, ...
            "Anatomical_location": {
                "COAD": ["Appendix"]
            }
        }
        , possibly more objects
    ]

response:

    [
        [
            { "Tumor_type_code": "MEL", "cell": "CD4_STROMA", "value": 4.92878303672137 },
            { "Tumor_type_code": "MEL", "cell": "CD4_STROMA", "value": 3.48051492517431 },
            { "Tumor_type_code": "COAD", "cell": "CD4_STROMA", "value": 4.64919217514609 },
            { "Tumor_type_code": "COAD", "cell": "CD4_STROMA", "value": 3.50456795234169 },
            { "Tumor_type_code": "COAD", "cell": "CD8_STROMA", "value": 2.0 },
            ...
        ]
        , one array reply for each input object
    ]
```

