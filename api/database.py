from lifelines import CoxPHFitter, KaplanMeierFitter
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

ntiles = lambda xs,groups=2: pd.cut(pd.Series(xs).rank(), groups, right=False, labels=False) + 1

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
    #db_str = db.to_json(orient='records', indent=2)

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

import numpy as np

def inf_to_nan(x):
    if x == np.inf or x == -np.inf:
        return np.nan
    else:
        return x

def Tukey_array(a):
    a = np.array(a)
    q1 = np.quantile(a, q=0.25)
    q3 = np.quantile(a, q=0.75)
    iqr15 = 1.5 * np.subtract(q3, q1)
    lower = inf_to_nan(np.min(np.compress(a > q1 - iqr15, a), initial=np.inf))
    upper = inf_to_nan(np.max(np.compress(a < q3 + iqr15, a), initial=-np.inf))
    return dict(
        mean=np.mean(a),
        median=np.median(a),
        q1=q1,
        q3=q3,
        lower=lower,
        upper=upper,
        lower_outliers=np.nan if lower == np.nan else np.sum(a < lower),
        upper_outliers=np.nan if upper == np.nan else np.sum(a > upper),
        min=a.min(),
        max=a.max(),
    )

def Tukey_grouped_series(df):
    df_dicts = df.agg(Tukey_array)
    df_flat = df_dicts.apply(lambda d: pd.Series(list(d.values()), index=d.keys()))
    return df_flat

def test_Tukey():
    df = db.data

    df_long = df[lambda row: (row['Tumor_type_code'] == 'COAD')].melt(
        id_vars = ['Tumor_type_code', 'Anatomical_location'],
        value_vars = db.cell_types,
        var_name = 'cell_full',
        value_name = 'expression')

    df_grouped = df_long.groupby(['Tumor_type_code', 'cell_full'])

    res = Tukey_grouped_series(df_grouped.expression)

    print(res)

def filter2(filter_id):
    base_filters = ['clinical_stage', 'pT_stage', 'pN_stage', 'pM_stage', 'Diff_grade', 'Neuralinv', 'Vascinv', 'PreOp_treatment_yesno', 'PostOp_type_treatment']
    data_filtered = db.data
    for key in base_filters:
        data_filtered = data_filtered[data_filtered[key].isin(filter_id[key])]

    # Filter based on tumor types
    dfs = pd.DataFrame(columns=data_filtered.columns)
    for t in filter_id['tumors']:
        if (t in filter_id['Morphological_type']) | (t in filter_id['Anatomical_location']) | (t in filter_id['MSI_ARTUR']):
            df = data_filtered[data_filtered['Tumor_type_code'] == t]
            if (t in filter_id['Morphological_type']):
                df = df[df['Morphological_type'].isin(filter_id['Morphological_type'][t])]
            if (t in filter_id['Anatomical_location']):
                df =  df[df['Anatomical_location'].isin(filter_id['Anatomical_location'][t])]
            if (t in filter_id['MSI_ARTUR']):
                df = df[df['MSI_ARTUR'].isin(filter_id['MSI_ARTUR'][t])]
        else:
            df = data_filtered[(data_filtered['Tumor_type_code'] == t)]
        dfs = dfs.append(df)

    # Filter the needed colums, melt and rename
    response = dfs.iloc[:,2].to_frame().join(dfs.iloc[:,18:46])
    response = response.melt(id_vars='Tumor_type_code')
    response.columns = ['tumor', 'cell_full', 'expression']

    # Split the cell_full to cell and location
    response.insert(2, 'cell', response['cell_full'].map(lambda x: '_'.join(x.split('_')[:-1])))
    response.insert(3, 'location', response['cell_full'].map(lambda x: x.split('_')[-1]))

    # Filter based on the requested cells
    response = response[response['cell'].isin(filter_id['cells'])]
    response = response.drop(columns='cell_full')
    return response

def filter(filter_id):
    base_filters = ['clinical_stage', 'pT_stage', 'pN_stage', 'pM_stage', 'Diff_grade', 'Neuralinv', 'Vascinv', 'PreOp_treatment_yesno', 'PostOp_type_treatment']
    data_filtered = db.data

    data_filtered = data_filtered[lambda row: row.Tumor_type_code.isin(filter_id['tumors'])]

    for key in base_filters:
        data_filtered = data_filtered[data_filtered[key].isin(filter_id[key])]

    for specific in ['Anatomical_location', 'MSI_ARTUR', 'Morphological_type']:
        for tumor, values in filter_id[specific].items():
            data_filtered = data_filtered[lambda row: (row.Tumor_type_code != tumor) | row[specific].isin(values)]
    response = data_filtered
    response = response.melt(id_vars='Tumor_type_code')
    response.columns = ['tumor', 'cell_full', 'expression']

    # Split the cell_full to cell and location
    response.insert(2, 'cell', response['cell_full'].map(lambda x: '_'.join(x.split('_')[:-1])))
    response.insert(3, 'location', response['cell_full'].map(lambda x: x.split('_')[-1]))

    # Filter based on the requested cells
    response = response[response['cell'].isin(filter_id['cells'])]
    response = response.drop(columns='cell_full')
    return response

def filter_survival(filter_id):
    base_filters = ['clinical_stage', 'pT_stage', 'pN_stage', 'pM_stage', 'Diff_grade', 'Neuralinv', 'Vascinv', 'PreOp_treatment_yesno', 'PostOp_type_treatment']
    data_filtered = db.data

    data_filtered = data_filtered[lambda row: row.Tumor_type_code.isin(filter_id['tumors'])]

    for key in base_filters:
        data_filtered = data_filtered[data_filtered[key].isin(filter_id[key])]

    for specific in ['Anatomical_location', 'MSI_ARTUR', 'Morphological_type']:
        for tumor, values in filter_id[specific].items():
            data_filtered = data_filtered[lambda row: (row.Tumor_type_code != tumor) | row[specific].isin(values)]

    groups = 3
    # Get the groups for ntiles and run the Kaplan Meier fitter for each of them
    data_filtered['rank'] = ntiles(data_filtered[filter_id['cells'][0]], groups)
    responses = []
    for g in range(groups):
        kmf = KaplanMeierFitter()
        kmf.fit(data_filtered[data_filtered['rank']==g+1]['T'], data_filtered[data_filtered['rank']==g+1]['E'],label='Kaplan_maier')
        responses.append(kmf.survival_function_.to_dict())
    return responses


def filter_to_tukey(body):
    df_long = filter(body)
    g = df_long.groupby(['tumor', 'cell', 'location'])
    return Tukey_grouped_series(g.expression).reset_index()


