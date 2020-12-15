from flask import Flask, request, jsonify, render_template, url_for, make_response, redirect
from lifelines import CoxPHFitter
import pandas as pd
import json
from flask_dance.contrib.google import make_google_blueprint, google
import os
import configparser

from database import db
import database as database_lib

config = configparser.ConfigParser()
config.read('/config/config.ini')

app = Flask(__name__, static_folder='/static/')

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1' #FIXME: Needs to be disabled?
os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'
app.secret_key = config['AUTH']['FlaskSecretKey']

app.config["GOOGLE_OAUTH_CLIENT_ID"]  = config['AUTH']['GoogleClientID']
app.config["GOOGLE_OAUTH_CLIENT_SECRET"] = config['AUTH']['GoogleClientSecret']

google_bp = make_google_blueprint(scope=["profile", "email"], redirect_url="/login")
app.register_blueprint(google_bp, url_prefix="/login")

whitelist_file = config['AUTH']['Whitelist']
with open(whitelist_file, 'r') as file:
    whitelist = [line.strip() for line in file]

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

@app.route('/size', methods=['OPTIONS', 'POST'])
def size():
    if request.method == 'OPTIONS':
        # CORS fetch with POST+Headers starts with a pre-flight OPTIONS:
        # https://github.com/github/fetch/issues/143
        return jsonify({})
    elif request.is_json:
        body = request.json
        response = database_lib.calculate_size(body)
        return jsonify(response)
    else:
        return jsonify({"error": "Body must be JSON"})

@app.route('/expression', methods=['OPTIONS', 'POST'])
def expression():
    if request.method == 'OPTIONS':
        # CORS fetch with POST+Headers starts with a pre-flight OPTIONS:
        # https://github.com/github/fetch/issues/143
        return jsonify({})
    elif request.is_json:
        body = request.json
        response = database_lib.expression(body).to_list()
        return jsonify(response)
        
@app.route('/content.json', methods=['POST', 'GET'])
def content():
    if request.method == 'GET':
        with open('contents.json') as json_file:
            response = json.load(json_file)
        return jsonify(response)
    elif request.method == 'POST':
        if not is_whitelisted():
            return redirect(url_for("login"))
        else:
            body = request.json
            with open('contents.json', 'w') as json_file:
                json.dump(body, json_file, indent=2)
            return jsonify({"success": True})
        
@app.route('/content.staged.json', methods=['POST', 'GET'])
def content_staged():
    if request.method == 'GET':
        with open('contents.staged.json') as json_file:
            response = json.load(json_file)
        return jsonify(response)
    elif request.method == 'POST':
        if not is_whitelisted():
            return jsonify({"success": False})
        else:
            body = request.json
            with open('contents.staged.json', 'w') as json_file:
                json.dump(body, json_file, indent=2)
            return jsonify({"success": True})

def is_whitelisted():
    '''
    Checks if the user is authenticated and whitelisted
    '''
    resp = google.get("/oauth2/v1/userinfo")
    if not resp.ok:
        return False
    elif resp.json()["email"] in whitelist:
        return True

@app.route("/login")
def login():
    '''
    Performs login with google and returns true
    if the email is whitelisted
    '''
    if not google.authorized:
        return redirect(url_for("google.login"))
    resp = google.get("/oauth2/v1/userinfo")
    assert resp.ok, resp.text
    if resp.json()["email"] in whitelist:
        return jsonify({"success": True})
    else:
        return jsonify({"success": False, "reason": "whitelist"})
