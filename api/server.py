from flask import Flask, request, jsonify, render_template, url_for, make_response
from lifelines import CoxPHFitter
import pandas as pd
import json

from database import db
import database as database_lib

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
        responses = []
        body = request.json
        # Basic filtering
        response = database_lib.filter(body)
        return jsonify([response.to_dict(orient='records')])
    else:
        return jsonify({"error": "Body must be JSON"})

@app.route('/tukey', methods=['OPTIONS', 'POST'])
@cross_origin
def tukey():
    if request.method == 'OPTIONS':
        # CORS fetch with POST+Headers starts with a pre-flight OPTIONS:
        # https://github.com/github/fetch/issues/143
        return jsonify({})
    elif request.is_json:
        body = request.json
        # Basic filtering
        response = database_lib.filter_to_tukey(body)
        return jsonify([response.fillna('NaN').to_dict(orient='records')])
    else:
        return jsonify({"error": "Body must be JSON"})


@app.route('/configuration')
@cross_origin
def configuration():
    def tidy_values(values):
        # values = database_lib.uniq(values)
        values = sorted(values, key=lambda x: (isinstance(x, float), x))
        values = [ 'missing' if pd.isnull(v) else v for v in values ]
        values = database_lib.uniq(values)
        return values
    tumor_specific_columns = [
        'Anatomical_location',
        'Morphological_type',
        'MSI_ARTUR',
    ]
    tumor_specific_values = []
    for column in tumor_specific_columns:
        # values = database_lib.uniq(data[c][lambda x: ~pd.isnull(x)])
        # print(c, values, flush=True)
        for tumor in db.tumor_types:
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


