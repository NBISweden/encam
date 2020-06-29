from flask import Flask, request, jsonify, render_template, url_for, make_response
from lifelines import CoxPHFitter
import pandas as pd
import json

from database import db
import database as database_lib

app = Flask(__name__, static_folder='/static/')

@app.route('/')
def main():
    """
    Serves the single-page webapp.
    """
    return app.send_static_file('index.html')

@app.after_request
def after_request(response):
    """
    Callback that triggers after each request. Currently no-op.
    """
    return response

@app.route('/ping')
def ping():
    return make_response("pong", "text/plain")

@app.route('/filter', methods=['OPTIONS', 'POST'])
def filter():
    if request.method == 'OPTIONS':
        # CORS fetch with POST+Headers starts with a pre-flight OPTIONS:
        # https://github.com/github/fetch/issues/143
        return jsonify({})
    elif request.is_json:
        responses = []
        body = request.json
        # Basic filtering
        responses = [
            database_lib.filter(b).to_dict(orient='records')
            for b in body
        ]
        return jsonify(responses)
    else:
        return jsonify({"error": "Body must be JSON"})

@app.route('/tukey', methods=['OPTIONS', 'POST'])
def tukey():
    if request.method == 'OPTIONS':
        # CORS fetch with POST+Headers starts with a pre-flight OPTIONS:
        # https://github.com/github/fetch/issues/143
        return jsonify({})
    elif request.is_json:
        body = request.json
        # Basic filtering
        responses = [
            database_lib.filter_to_tukey(b).fillna('NaN').to_dict(orient='records')
            for b in body
        ]
        return jsonify(responses)
    else:
        return jsonify({"error": "Body must be JSON"})


@app.route('/configuration')
def configuration():
    def tidy_values(values):
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
        # 'Tumor_type_code',
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
        'tumors': db.tumor_types,
        'cells_full': db.cell_types,
        'cells': tidy_values('_'.join(c.split('_')[:-1]) for c in db.cell_types),
        'tumor_codes': db.codes_dict,
    }
    return jsonify(config)

@app.route('/codes')
def codes():
    response = jsonify(db.codes_dict)
    return response

@app.route('/database')
def database():
    response = jsonify(db.db.to_dict(orient='records'))
    return response

@app.route('/survival', methods=['OPTIONS', 'POST'])
def survival():
    if request.method == 'OPTIONS':
        # CORS fetch with POST+Headers starts with a pre-flight OPTIONS:
        # https://github.com/github/fetch/issues/143
        return jsonify({})
    elif request.is_json:
        body = request.json
        response = database_lib.filter_survival(body)
        return jsonify(response)
    else:
        return jsonify({"error": "Body must be JSON"})
