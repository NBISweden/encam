from lifelines import CoxPHFitter, KaplanMeierFitter
from lifelines.exceptions import ConvergenceError
from lifelines.statistics import multivariate_logrank_test
import pandas as pd
import numpy as np
import os
from itertools import accumulate

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
        if len(uniq(dd[i])) < 2:
            print("Removing %s column from %i due to single rank", (dd[i], i))
            del dd[i]
        else:
            dd[i] = ntiles(dd[i])

    univariate_results = []
    for c in cell_types:
        if c in dd:
            dd_c = dd[[c, 'T', 'E']]
            dd_c = dd_c[~pd.isnull(dd_c).any(axis=1)]
            cph = CoxPHFitter()
            try:
              cph.fit(dd_c, 'T', event_col='E') # fits are ~15-60 ms each
              summary = cph.summary
              summary.replace([np.inf, -np.inf], np.nan, inplace=True)
              if not summary.isnull().values.any():
                  univariate_results.append(summary)
              else:
                  print("No summary for %s" % c)
            except ConvergenceError as err:
                print(err)
                continue

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
    return pd.concat((expression, cox), axis=1).dropna()

ntiles = lambda xs,groups=2: pd.cut(pd.Series(xs).rank(na_option='keep'), groups, right=False, labels=False) + 1

def init():
    print("Initialization started", flush=True)

    dataset = os.getenv('DATASET', './SIM.csv')
    data = pd.read_csv(dataset)

    # Whitespace stripping because of some trailing Morphological_type spaces
    strip = lambda x: x.strip() if isinstance(x, str) else x
    data = data.applymap(strip)
    # data = data.sample(frac = 0.25)
    # data = data.sample
    # data = data[lambda row: (row.Tumor_type_code == 'BRCA') | (row.Tumor_type_code == 'COAD')]

    # Remove those rows that do not have this data
    data['T'] = data['Time_Diagnosis_Last_followup']
    data['T'].astype(str)

    # Rename columns to used names
    if dataset != './SIM.csv':
        data['MSI_ARTUR'] = data['MSI']
        data['clinical_stage'] = data['clinicl_stge']
        data['Anatomical_location'] = data['Atomical_location']
        data['T'] = data['Time_Diagnosis_Last_followup']

    # Assumption> fill missing if undefined
    remove_nas = lambda x: "missing" if pd.isna(x) else x
    for attr in ["PreOp_treatment_yesno", "PostOp_type_treatment"]:
        data[attr] = data[attr].map(remove_nas)

    # Fill consistent spelling for yes/no cells
    to_lower = lambda x: x.lower() if isinstance(x, str) and x.lower() in ["yes", "no"] else x
    for attr in ["PreOp_treatment_yesno", "PostOp_type_treatment", "Neuralinv", "Vascinv"]:
        data[attr] = data[attr].map(to_lower)

    data['Anatomical_location'].astype(str)

    data['E'] = data['Event_last_followup'] == 'Dead'
    data['E'].astype(bool)

    tumor_types = uniq(data.Tumor_type_code)
    cell_types = uniq(c for c in data.columns if 'TUMOR' in c or 'STROMA' in c)

    dfs = []
    for t in tumor_types:
        df = data_per_type(data[(data.Tumor_type_code == t)], cell_types)
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
    a = a[a != "missing"]
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

''' Function used only for testing purposes
    File test.py compares the filter2 with the filter function
'''
def filter2(filter_id):
    base_filters = ['clinical_stage', 'pT_stage', 'pN_stage', 'pM_stage', 'Diff_grade', 'Neuralinv', 'Vascinv', 'PreOp_treatment_yesno', 'PostOp_type_treatment']
    data_filtered = db.data
    data_filtered = data_filtered.fillna('missing')
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

def filtering(filter_id):
    base_filters = ['clinical_stage', 'pT_stage', 'pN_stage', 'pM_stage', 'Diff_grade', 'Neuralinv', 'Vascinv', 'PreOp_treatment_yesno', 'PostOp_type_treatment']
    data_filtered = db.data
    data_filtered = data_filtered.fillna('missing')
    data_filtered = data_filtered[lambda row: row.Tumor_type_code.isin(filter_id['tumors'])]

    for key in base_filters:
        data_filtered = data_filtered[data_filtered[key].isin(filter_id[key])]

    for specific in ['Anatomical_location', 'MSI_ARTUR', 'Morphological_type']:
        for tumor, values in filter_id[specific].items():
            data_filtered = data_filtered[lambda row: (row.Tumor_type_code != tumor) | row[specific].isin(values)]

    return data_filtered

def filter(filter_id):

    response = filtering(filter_id)
    response = response.melt(id_vars='Tumor_type_code')
    response.columns = ['tumor', 'cell_full', 'expression']

    # Split the cell_full to cell and location
    response.insert(2, 'cell', response['cell_full'].map(lambda x: '_'.join(x.split('_')[:-1])))
    response.insert(3, 'location', response['cell_full'].map(lambda x: x.split('_')[-1]))

    # Filter based on the requested cells
    response = response[response['cell'].isin(filter_id['cells'])]
    response = response.drop(columns='cell_full')
    return response


def binning(data_filtered, cell, group_sizes):
    acc_group_sizes = list(accumulate(group_sizes))
    group_values = [0]
    for num in acc_group_sizes[:-1]:
        group_values.append(data_filtered[cell].iloc[num])
    group_values.append(float('inf'))
    # OBS: removing duplicate groups
    group_values = uniq(group_values)
    return pd.cut(data_filtered[cell], bins=group_values, include_lowest=True, right=False, labels=False) + 1


def filter_survival(filter_id):

    data_filtered = filtering(filter_id)
    data_filtered = data_filtered[data_filtered[filter_id['cell_full']] != "missing"]

    # Get the groups for ntiles and run the Kaplan Meier fitter for each of them
    # If the group_sizes are provided, use the binning function, otherwise the general ntiles
    if filter_id['group_sizes'] != None:
        data_filtered['rank'] = binning(data_filtered.sort_values(by=filter_id['cell_full']), filter_id['cell_full'], filter_id['group_sizes'])
    else:
        data_filtered['rank'] = ntiles(data_filtered[filter_id['cell_full']], filter_id['num_groups'])
    points = []
    # OBS: checking the number of groups after filtering
    num_groups = len(uniq(data_filtered['rank']))
    if num_groups < 2:
        raise ValueError('Number of groups must be at least two.')
    points_dfs = []
    alive_dfs = []
    for g in range(num_groups):
        kmf = KaplanMeierFitter()
        data = data_filtered[lambda row: row['rank'] == g+1]
        kmf.fit(
            data['T'],
            data['E'],
            label='Kaplan_Meier',
        )
        df = pd.concat([
            kmf.survival_function_,
            kmf.confidence_interval_survival_function_,
        ], axis=1)
        df['group'] = g+1
        points_dfs += [df]

        alive_df = kmf.survival_function_at_times(data[data['E']==False]['T']).to_frame().reset_index()
        alive_df['group'] = g+1
        alive_dfs += [alive_df]

    # Curate points and alive points
    points_df = pd.concat(points_dfs).reset_index().rename(columns={
        'index': 'time',
        'Kaplan_Meier': 'fit',
        'Kaplan_Meier_lower_0.95': 'lower',
        'Kaplan_Meier_upper_0.95': 'upper',
    })
    points = points_df.to_dict(orient='records')

    alive_points_df = pd.concat(alive_dfs).rename(columns={
        'index': 'time',
        'Kaplan_Meier': 'fit',
        'group': 'group',
    })
    alive_points = alive_points_df.to_dict(orient='records')

    # Run multivarate analysis
    log_rank = multivariate_logrank_test(data_filtered['T'], data_filtered['rank'], data_filtered['E'])
    log = {
        'test_statistic_logrank': log_rank.summary['test_statistic'][0],
        'p_logrank': log_rank.summary['p'][0]
    }

    # Run cox regression
    cph = CoxPHFitter()
    cph.fit(data_filtered[['rank', 'T', 'E']], 'T', event_col='E')
    cox = {
        'coef': cph.summary['exp(coef)'][0],
        'lower': cph.summary['exp(coef) lower 95%'][0],
        'upper': cph.summary['exp(coef) upper 95%'][0],
        'p': cph.summary['p'][0]
    }

    # Replace infinite values with max or min probabilities
    if cox['upper'] == float('inf'):
        cox['upper'] = 1.0
    if cox['lower'] == float('-inf'):
        cox['lower'] = 0.0
    return {'points': points, 'log_rank': log, 'cox_regression': cox, 'live_points': alive_points}

def calculate_size(filter_id):
    data_filtered = filtering(filter_id)
    return {'size': data_filtered.shape[0]}

def expression(filter_id):
    response = filtering(filter_id)
    filtered = response[response[filter_id['cell_full']] != "missing"]
    response = filtered.sort_values(by=filter_id['cell_full'])
    return response[filter_id['cell_full']]


def filter_to_tukey(body):
    df_long = filter(body)
    g = df_long.groupby(['tumor', 'cell', 'location'])
    return Tukey_grouped_series(g.expression).reset_index()


