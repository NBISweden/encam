from flask import Flask, request, jsonify, render_template, url_for, make_response
from lifelines import CoxPHFitter
import pandas as pd
import json

app = Flask(__name__)

def cross_origin(f):
    import functools
    @functools.wraps(f)
    def F(*args, **kws):
        response = f(*args, **kws)
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return response
    return F

@app.route('/ping')
@cross_origin
def ping():
    return make_response("pong", "text/plain")

@app.route('/filter', methods=['OPTIONS', 'POST'])
@cross_origin
def filter():
    if request.method == 'OPTIONS':
        # CORS fetch with POST+Headers starts with a pre-flight OPTIONS:
        # https://github.com/github/fetch/issues/143
        return jsonify({})
    elif request.is_json:
        body = request.json
        # Basic filtering
        base_filters = ['clinical_stage', 'pT_stage', 'pN_stage', 'pM_stage', 'Diff_grade', 'Neuralinv', 'Vascinv', 'PreOp_treatment_yesno', 'PostOp_type_treatment']
        for key in base_filters:
            data_filtered = data[data[key].isin(body[0][key])]

        # Filter based on tumor types
        dfs = pd.DataFrame(columns=data_filtered.columns)
        complex_tumors = ['COAD', 'READ']
        for t in body[0]['tumors']:
            if t in complex_tumors:
                df = data_filtered[(data_filtered['Tumor_type_code'] == t) & (data_filtered['Morphological_type'].isin(body[0]['Morphological_type'][t]))
                    & (data_filtered['Anatomical_location'].isin(body[0]['Anatomical_location'][t])) &  (data_filtered['MSI_ARTUR'].isin(body[0]['MSI_ARTUR'][t]))]
            else:
                df = data_filtered[(data_filtered['Tumor_type_code'] == t)]
            dfs = dfs.append(df)

        dat2 = dfs.iloc[:,2].to_frame().join(dfs.iloc[:,18:46])
        dat2 = dat2.melt(id_vars='Tumor_type_code')
        dat2.columns = ['tumor', 'cell', 'expression']
        print(dfs.shape)
        return jsonify(dat2.to_dict(orient='records'))
    else:
        return jsonify({"error": "Body must be JSON"})

@app.route('/configuration')
@cross_origin
def configuration():
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
    for column in tumor_specific_columns:
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
    return jsonify(config)

@app.route('/codes')
@cross_origin
def codes():
    response = jsonify(codes_dict)
    return response

@app.route('/database')
@cross_origin
def database():
    response = jsonify(db.to_dict(orient='records'))
    return response

def uniq(xs):
    seen = set()
    return [
        (seen.add(x), x)[-1]
        for x in xs
        if x not in seen
    ]

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

print("Initialization started")
ntiles = lambda xs: pd.cut(pd.Series(xs).rank(), 2, right=False, labels=False) + 1

data = pd.read_csv("../SIM.csv")

# Whitespace stripping because of some trailing Morphological_type spaces
strip = lambda x: x.strip() if isinstance(x, str) else x
data = data.applymap(strip)

data['T'] = data['Time_Diagnosis_Last_followup']
data['E'] = data['Event_last_followup'] == 'Dead'

tumor_types = uniq(data.Tumor_type_code)
cell_types = uniq(c for c in data.columns if 'TUMOR' in c or 'STROMA' in c)

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

# OUTPUT - First result to return
db = pd.concat(dfs, axis=0).reset_index(drop=True)
db_str = db.to_json(orient='records', indent=2)

# OUTPUT - Second resutls to return
codes_list = data[['Tumor_type', 'Tumor_type_code']].to_dict(orient='records')
codes_dict = {d['Tumor_type_code']: d['Tumor_type'] for d in codes_list}
print("Initialization finished")
