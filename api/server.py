from flask import Flask, request, jsonify, render_template, url_for, make_response, redirect
from lifelines import CoxPHFitter
import pandas as pd
import json
from flask_dance.contrib.google import make_google_blueprint, google
from oauthlib.oauth2.rfc6749.errors import InvalidGrantError, TokenExpiredError
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

google_bp = make_google_blueprint(scope=["profile", "email"], redirect_url="/api/login")
app.register_blueprint(google_bp, url_prefix="/login")

whitelist_file = config['AUTH']['Whitelist']
with open(whitelist_file, 'r') as file:
    whitelist = [line.strip() for line in file]

@app.route('/api/')
def root():
    """
    Static page is served by nginx so here you get 204 No Content
    """
    return '', 204

@app.route('/api/ping')
def ping():
    return make_response("pong", "text/plain")

@app.route('/api/filter', methods=['OPTIONS', 'POST'])
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

@app.route('/api/tukey', methods=['OPTIONS', 'POST'])
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


@app.route('/api/configuration')
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

@app.route('/api/codes')
def codes():
    response = jsonify(db.codes_dict)
    return response

@app.route('/api/database')
def database():
    response = jsonify(db.db.to_dict(orient='records'))
    return response

@app.route('/api/survival', methods=['OPTIONS', 'POST'])
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

@app.route('/api/size', methods=['OPTIONS', 'POST'])
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

@app.route('/api/expression', methods=['OPTIONS', 'POST'])
def expression():
    if request.method == 'OPTIONS':
        # CORS fetch with POST+Headers starts with a pre-flight OPTIONS:
        # https://github.com/github/fetch/issues/143
        return jsonify({})
    elif request.is_json:
        body = request.json
        response = database_lib.expression(body).to_list()
        return jsonify(response)

@app.route('/api/content.json', methods=['POST', 'GET'])
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

@app.route('/api/content.staged.json', methods=['POST', 'GET'])
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

@app.route("/api/login")
def login():
    '''
    User tries to login via google and is redirected back to / if successful.
    '''
    if not google.authorized:
        return redirect(url_for("google.login"))
    try:
        resp = google.get("/oauth2/v1/userinfo")
    except (InvalidGrantError, TokenExpiredError) as e:
        # https://github.com/singingwolfboy/flask-dance/issues/35
        return redirect(url_for("google.login"))
    assert resp.ok, resp.text
    print('User', resp.json(), 'logged in, redirecting back to /')
    return redirect('/')

@app.route("/api/login_status")
def login_status():
    '''
    Get the logged in status.
    '''
    resp = google.get("/oauth2/v1/userinfo")
    if resp.ok:
        return jsonify({**resp.json(), "logged_in": True, "whitelisted": is_whitelisted()})
    else:
        return jsonify({"logged_in": False, "whitelisted": False})
