from flask import Flask, request, jsonify, render_template, url_for, make_response
from lifelines import CoxPHFitter
import pandas as pd
import json

from database import db

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
            data_filtered = db.data[db.data[key].isin(body[0][key])]

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

        response = dfs.iloc[:,2].to_frame().join(dfs.iloc[:,18:46])
        response = response.melt(id_vars='Tumor_type_code')
        response.columns = ['tumor', 'cell_full', 'expression']

        # Split the cell_full to cell and location
        response.insert(2, 'cell', response['cell_full'].map(lambda x: '_'.join(x.split('_')[:-1])))
        response.insert(3, 'location', response['cell_full'].map(lambda x: x.split('_')[-1]))
        # Filter based on the requested cells
        response = response[response['cell'].isin(body[0]['cells'])]
        response = response.drop(columns='cell_full')
        return jsonify([response.to_dict(orient='records')])
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
        # print(c, values, flush=True)
        for tumor in tumor_types:
            values = tidy_values(db.data[db.data.Tumor_type_code == tumor][column])
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
        values = tidy_values(db.data[column])
        variant_values.append({
            'column': column,
            'values': values
        })
    config = {
        'variant_values': variant_values,
        'tumor_specific_values': tumor_specific_values,
        'cell_types_full': db.cell_types,
        'cell_types': tidy_values('_'.join(c.split('_')[:-1]) for c in db.cell_types)
    }
    return jsonify(config)

@app.route('/codes')
@cross_origin
def codes():
    response = jsonify(db.codes_dict)
    return response

@app.route('/database')
@cross_origin
def database():
    response = jsonify(db.db.to_dict(orient='records'))
    return response


