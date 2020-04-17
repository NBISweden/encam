'''
    This code preprocesses SIM.csv into a json "database" frontend/db.json. The json looks like this:

        [
          {
            "tumor":"Colon",
            "cell":"CD4",
            "location":"TUMOR",
            "cell_full":"CD4_TUMOR",
            "expression":89.02,
            "coef":0.6703,
            "lower":0.4474,
            "upper":1.004,
            "p":0.05242
          },
          {
            "tumor":"Colon",
            "cell":"CD4_Treg",
            "location":"TUMOR",
            "cell_full":"CD4_Treg_TUMOR",
            "expression":3.248,
            "coef":0.8724,
            "lower":0.5743,
            "upper":1.325,
            "p":0.5222
          },
          {
            "tumor":"Colon",
            "cell":"CD8",
            "location":"TUMOR",
            "cell_full":"CD8_TUMOR",
            "expression":132.5,
            "coef":0.777,
            ...
          },
          ...
        ]

    It uses code from python port of forestplots.R, see forestplots.py and forestplots.ipynb.

    Additionally it creates frotend/codes.json which is a mapping from tumor type acronyms
    to their expanded versions:

        {
          "COAD": "Colon adenocarcinoma",
          "READ": "Rectum adenocarcinoma",
          ...
        }
'''
# !pip install --user lifelines
from lifelines import CoxPHFitter
import pandas as pd
import json

# https://rdrr.io/cran/schoRsch/src/R/ntiles.R
ntiles = lambda xs: pd.cut(pd.Series(xs).rank(), 2, right=False, labels=False) + 1

def uniq(xs):
    seen = set()
    return [
        (seen.add(x), x)[-1]
        for x in xs
        if x not in seen
    ]

data = pd.read_csv("./SIM.csv")

# Whitespace stripping because of some trailing Morphological_type spaces
strip = lambda x: x.strip() if isinstance(x, str) else x
data = data.applymap(strip)

data['T'] = data['Time_Diagnosis_Last_followup']
data['E'] = data['Event_last_followup'] == 'Dead'

tumor_types = uniq(data.Tumor_type_code)

cell_types = uniq(c for c in data.columns if 'TUMOR' in c or 'STROMA' in c)

def coxph_per_type(dd):
    dd = dd.copy()

    for i in cell_types:
        dd[i] = ntiles(dd[i])

    univariate_results = []
    for c in cell_types:
        dd_c = dd[[c, 'T', 'E']]
        dd_c = dd_c[~pd.isnull(dd_c).any(axis=1)]
        cph = CoxPHFitter()
        cph.fit(dd_c, 'T', event_col='E') # fits are ~15-60 ms each
        univariate_results.append(cph.summary)

    cox = pd.concat(univariate_results)
    rename = {
        'exp(coef)': 'coef',
        'exp(coef) lower 95%': 'lower',
        'exp(coef) upper 95%': 'upper',
        'p': 'p',
    }
    cox = cox[rename.keys()]
    cox = cox.rename(columns=rename)
    return cox


def data_per_type(dd):
    expression = pd.DataFrame({'expression': dd[cell_types].mean()})
    cox = coxph_per_type(dd)
    return pd.concat((expression, cox), axis=1)


# This takes about 15s
dfs = []
for t in tumor_types:
    df = data_per_type(data[
        (data.Tumor_type_code == t) &
        (data['PreOp_treatment_yesno'] == 'No')
    ])
    # df = df.astype('float16')
    df = df.applymap(lambda x: float(f'{x:.3e}'))
    cell_full = df.index
    df.reset_index(drop=True, inplace=True)
    df.insert(0, 'tumor', t)
    df.insert(1, 'cell', cell_full.map(lambda x: '_'.join(x.split('_')[:-1])))
    df.insert(2, 'location', cell_full.map(lambda x: x.split('_')[-1]))
    df.insert(3, 'cell_full', cell_full)
    dfs.append(df)

db = pd.concat(dfs, axis=0).reset_index(drop=True)
db_str = db.to_json(orient='records', indent=2)

def write_json(filename, obj):
    if not isinstance(obj, str):
        obj = json.dumps(obj, indent=2)

    with open(filename, 'w') as fp:
        fp.write(obj)

    import gzip
    print(filename + ':')
    print('\n'.join(obj.split('\n')[:15]) + '...')
    print()
    print('json len:', len(obj))
    print('gzipped:', len(gzip.compress(obj.encode())))

write_json('./frontend/db.json', db_str)

codes_list = data[['Tumor_type', 'Tumor_type_code']].to_dict(orient='records')
codes_dict = {d['Tumor_type_code']: d['Tumor_type'] for d in codes_list}

write_json('./frontend/codes.json', codes_dict)

def form_configuration():
    '''
    This is a work in progress of getting the configuration for the form.
    '''

    def tidy_values(values):
        values = uniq(values)
        values = sorted(values, key=lambda x: (isinstance(x, float), x))
        values = [ 'missing' if pd.isnull(v) else v for v in values ]
        return values

    tumor_specific_columns = [
        'Anatomical_location',
        'Morphological_type',
        'MSI_ARTUR',
    ]

    tumor_specific_values = []
    for column in tumor_specific_column:
        # values = uniq(data[c][lambda x: ~pd.isnull(x)])
        # print(c, values)
        for tumor in tumor_types:
            values = tidy_values(data[data.Tumor_type_code == tumor][column])
            if len(values) > 1:
                tumor_specific_values.append({
                    'column': column,
                    'tumor': tumor,
                    'values': values
                })

    variant_columns = [
        'Tumor_type_code',
        # 'Gender',
        # 'Anatomical_location',
        # 'Morphological_type',
        'clinical_stage',
        'pT_stage',
        'pN_stage',
        'pM_stage',
        'Diff_grade',
        'Neuralinv',
        'Vascinv',
        'PreOp_treatment_yesno',
        'PostOp_type_treatment',
        # 'MSI_ARTUR',
    ]

    variant_values = []
    for column in variant_columns:
        values = tidy_values(data[column])
        variant_values.append({
            'column': column,
            'values': values
        })

    config = {
        'variant_values': variant_values,
        'tumor_specific_values': tumor_specific_values,
        'cell_types_full': cell_types,
        'cell_types': tidy_values('_'.join(c.split('_')[:-1]) for c in cell_types)
    }
    write_json('./frontend/form_configuration.json', config)

form_configuration()

