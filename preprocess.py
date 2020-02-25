'''
This code preprocesses made-up-data.csv into a json "database" db.json. The json looks like this:
    {
      "by_tumor": {
        "Colon": {
          "CD4": {
            "TUMOR": {
              "expression": 89.02,
              "coef": 0.6703,
              "lower": 0.4474,
              "upper": 1.004,
              "p": 0.05242
            },
            "STROMA": {
              "expression": 115.8,
              "coef": 0.6789,
              "lower": 0.4429,
              "upper": 1.041,
              "p": 0.07548
            }
          },
          "CD4_Treg": {
            "TUMOR": {
              "expression": 3.248,
              "coef": 0.8724,
              "lower": 0.5743,
              "upper": 1.325,
              "p": 0.5222
            },
            "STROMA": {
              "expression": 6.725,
              "coef": 0.6232,...
later on there is a section "by_cell" as well.
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
locations = ['TUMOR', 'STROMA']
cell_types_no_loc = uniq([c.replace('_TUMOR', '').replace('_STROMA', '') for c in cell_types])


def coxph_per_type(dd, cell_types=cell_types):
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


def data_per_type(dd, cell_types=cell_types):
    expression = pd.DataFrame({'expression': dd[cell_types].mean()})
    cox = coxph_per_type(dd, cell_types=cell_types)
    return pd.concat((expression, cox), axis=1)


processed = {}
for t in tumor_types:
    d = data_per_type(data[data.cohort == t])
    # d = d.astype('float16')
    d = d.applymap(lambda x: float(f'{x:.3e}'))
    d = d.to_dict(orient='index')
    processed[t] = {
        cell: {
            loc: d[cell + '_' + loc]
            for loc in locations
            if cell + '_' + loc in d
        }
        for cell in cell_types_no_loc
    }


def transpose(d):
    assert all(isinstance(v, dict) for v in d.values())
    outer_keys = d.keys()
    inner_keys = uniq(k for v in d.values() for k in v.keys())
    return {
        ik: {
            ok: d[ok][ik]
            for ok in outer_keys
            if ik in d[ok]
        }
        for ik in inner_keys
    }

A = {'a': {'x': 1, 'y': 2}, 'b': {'y': 3, 'z': 4}}
B = {'x': {'a': 1}, 'y': {'a': 2, 'b': 3}, 'z': {'b': 4}}

json_eq = lambda x, y: json.dumps(x, sort_keys=True) == json.dumps(y, sort_keys=True)

assert json_eq(transpose(A), B)
assert json_eq(transpose(transpose(A)), A)

result = {
    'by_tumor': processed,
    'by_cell': transpose(processed)
}

result_json = json.dumps(result, indent=2)

with open('./db.json', 'w') as fp:
    fp.write(result_json)

import gzip
print('\n'.join(result_json.split('\n')[:30]) + '...')
print()
print('json len:', len(result_json))
print('gzipped:', len(gzip.compress(result_json.encode())))
