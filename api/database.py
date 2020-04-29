from lifelines import CoxPHFitter
import pandas as pd
import json

def uniq(xs):
    seen = set()
    return [
        (seen.add(x), x)[-1]
        for x in xs
        if x not in seen
    ]

def coxph_per_type(dd, cell_types):
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

def data_per_type(dd, cell_types):
    expression = pd.DataFrame({'expression': dd[cell_types].mean()})
    cox = coxph_per_type(dd, cell_types)
    return pd.concat((expression, cox), axis=1)

ntiles = lambda xs: pd.cut(pd.Series(xs).rank(), 2, right=False, labels=False) + 1

def init():
    print("Initialization started", flush=True)

    data = pd.read_csv("../SIM.csv")

    # Whitespace stripping because of some trailing Morphological_type spaces
    strip = lambda x: x.strip() if isinstance(x, str) else x
    data = data.applymap(strip)
    # data = data.sample(frac = 0.25)
    # data = data.sample
    # data = data[lambda row: (row.Tumor_type_code == 'BRCA') | (row.Tumor_type_code == 'COAD')]

    data['T'] = data['Time_Diagnosis_Last_followup']
    data['E'] = data['Event_last_followup'] == 'Dead'

    tumor_types = uniq(data.Tumor_type_code)
    cell_types = uniq(c for c in data.columns if 'TUMOR' in c or 'STROMA' in c)

    dfs = []
    for t in tumor_types:
        df = data_per_type(
          data[
            (data.Tumor_type_code == t) &
            (data['PreOp_treatment_yesno'] == 'No')],
          cell_types)
        # df = df.astype('float16')
        df = df.applymap(lambda x: float(f'{x:.3e}'))
        cell_full = df.index
        df.reset_index(drop=True, inplace=True)
        df.insert(0, 'tumor', t)
        df.insert(1, 'cell', cell_full.map(lambda x: '_'.join(x.split('_')[:-1])))
        df.insert(2, 'location', cell_full.map(lambda x: x.split('_')[-1]))
        df.insert(3, 'cell_full', cell_full)
        dfs.append(df)

    # OUTPUT - First result to return
    db = pd.concat(dfs, axis=0).reset_index(drop=True)
    db_str = db.to_json(orient='records', indent=2)

    # OUTPUT - Second results to return
    codes_list = data[['Tumor_type', 'Tumor_type_code']].to_dict(orient='records')
    codes_dict = {d['Tumor_type_code']: d['Tumor_type'] for d in codes_list}
    print("Initialization finished", flush=True)

    return dict(
        db=db,
        codes_dict=codes_dict,
        data=data,
        tumor_types=tumor_types,
        cell_types=cell_types,
    )

import pickle

def create_db():
    print('Creating database', flush=True)
    db = init()
    print('Saving pickle', flush=True)
    pickle.dump(db, open('db.pickle', 'wb'))
    return db

# create_db()

try:
    print('Loading pickle', flush=True)
    db = pickle.load(open('db.pickle', 'rb'))
except FileNotFoundError:
    db = create_db()

class dotdict(dict):
    __getattr__ = dict.get

db=dotdict(db)

print('Database loaded', flush=True)
