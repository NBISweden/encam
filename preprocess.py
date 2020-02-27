'''
This code preprocesses made-up-data.csv into a json "database" db.json. The json looks like this:
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
        "coef":0.777,...
It uses code from python port of forestplots.R, see forestplots.py and forestplots.ipynb.
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

data = pd.read_csv("./made-up-data.csv")
data = data[ data['PreOp_treatment_yesno'] == 'No' ]

data['T'] = data['Time_Diagnosis_Last_followup']
data['E'] = data['Event_last_followup'] == 'Dead'

tumor_types = uniq(data.cohort)

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
        cph.fit(dd_c, 'T', event_col='E')
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


dfs = []
for t in tumor_types:
    df = data_per_type(data[data.cohort == t])
    # df = df.astype('float16')
    df = df.applymap(lambda x: float(f'{x:.3e}'))
    cell_full = df.index
    df.reset_index(drop=True, inplace=True)
    df.insert(0, 'tumor', t)
    df.insert(1, 'cell', cell_full.map(lambda x: '_'.join(x.split('_')[0:-1])))
    df.insert(2, 'location', cell_full.map(lambda x: x.split('_')[-1]))
    df.insert(3, 'cell_full', cell_full)
    dfs.append(df)

db = pd.concat(dfs, axis=0).reset_index(drop=True)
db_str = db.to_json(orient='records', indent=2)

with open('./frontend/db.json', 'w') as fp:
    fp.write(db_str)

import gzip
print('\n'.join(db_str.split('\n')[:30]) + '...')
print()
print('json len:', len(db_str))
print('gzipped:', len(gzip.compress(db_str.encode())))
