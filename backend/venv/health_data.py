import os
import time
import requests
from datetime import datetime, timedelta
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from predict_user import automatic_input_and_predict

SCOPES = [
    'https://www.googleapis.com/auth/fitness.body.read',
    'https://www.googleapis.com/auth/fitness.body.write',
    'https://www.googleapis.com/auth/fitness.sleep.read',
    'https://www.googleapis.com/auth/fitness.blood_glucose.read',
    'https://www.googleapis.com/auth/fitness.blood_glucose.write',
    'https://www.googleapis.com/auth/fitness.blood_pressure.read',
    'https://www.googleapis.com/auth/fitness.blood_pressure.write',
    'https://www.googleapis.com/auth/user.birthday.read'
]

def authorize(client_secret_file, token_file):
    creds = None
    if os.path.exists(token_file):
        creds = Credentials.from_authorized_user_file(token_file, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(client_secret_file, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(token_file, 'w') as token:
            token.write(creds.to_json())
    return creds

def extract_bp(values):
    if len(values) >= 2:
        return values[0].get("fpVal"), values[1].get("fpVal")
    return None, None

def get_birth_year(token):
    res = requests.get(
        "https://people.googleapis.com/v1/people/me?personFields=birthdays",
        headers={"Authorization": f"Bearer {token}"}
    )
    if res.status_code == 200:
        data = res.json()
        for b in data.get("birthdays", []):
            if "year" in b.get("date", {}):
                return b["date"]["year"]
    return None

def calculate_bmi(weight_kg, height_m):
    if weight_kg and height_m:
        return round(weight_kg / (height_m ** 2), 2)
    return None

def calculate_age(year):
    return datetime.now().year - year

def debug_all_sources(creds):
    print("\n Listing all available data sources:")
    service = build('fitness', 'v1', credentials=creds)
    sources = service.users().dataSources().list(userId='me').execute()
    for src in sources.get("dataSource", []):
        print(f" {src.get('dataStreamId')}")

def list_all_data_source_ids(creds):
    print("\n Full data source listing (detailed):")
    service = build('fitness', 'v1', credentials=creds)
    sources = service.users().dataSources().list(userId='me').execute()
    for src in sources.get("dataSource", []):
        print(f"\n🔹 ID: {src.get('dataStreamId')}")
        print(f"    Data Type: {src.get('dataType', {}).get('name')}")
        print(f"    Type: {src.get('type')} | Application: {src.get('application', {}).get('details', 'N/A')}")
        print(f"    Last Updated: {src.get('dataStreamName', 'N/A')}")

def scan_raw_pressure(creds, days=30):
    print("\n Scanning all blood_pressure sources for raw values:")
    service = build('fitness', 'v1', credentials=creds)
    end = datetime.now()
    start = end - timedelta(days=days)
    dataset_id = f"{int(start.timestamp()*1e9)}-{int(end.timestamp()*1e9)}"

    sources = service.users().dataSources().list(userId='me').execute()
    for src in sources.get("dataSource", []):
        stream_id = src.get("dataStreamId", "")
        data_type = src.get("dataType", {}).get("name", "")
        if "blood_pressure" in data_type or "blood_pressure" in stream_id:
            print(f"\n Source: {stream_id}")
            try:
                dataset = service.users().dataSources().datasets().get(
                    userId='me',
                    dataSourceId=stream_id,
                    datasetId=dataset_id
                ).execute()
                points = dataset.get("point", [])
                if points:
                    for p in points:
                        start_time = int(p.get("startTimeNanos", 0)) / 1e9
                        readable = datetime.fromtimestamp(start_time).strftime("%Y-%m-%d %H:%M")
                        print(f" {readable} → {p['value']}")
                else:
                    print(" No data points found.")
            except Exception as e:
                print(f" Error reading dataset: {e}")

def create_blood_pressure_datasource(creds):
    service = build('fitness', 'v1', credentials=creds)
    body = {
        "dataStreamName": "Blood Pressure Manual Entry",
        "type": "raw",
        "application": {
            "name": "manual_entry"
        },
        "dataType": {
            "name": "com.google.blood_pressure",
            "field": [
                {"name": "blood_pressure_systolic", "format": "floatPoint"},
                {"name": "blood_pressure_diastolic", "format": "floatPoint"}
            ]
        },
        "device": {
            "uid": "123456",
            "type": "unknown",
            "manufacturer": "manual",
            "model": "manual_bp_entry"
        }
    }
    try:
        print("Creating Blood Pressure Data Source...")
        response = service.users().dataSources().create(userId='me', body=body).execute()
        print(" Data Source Created Successfully!")
        print("Data Source ID:", response.get("dataStreamId"))
    except Exception as e:
        print(f" Failed to Create Data Source: {e}")

def write_test_blood_pressure(creds, sbp=120, dbp=80):
    service = build('fitness', 'v1', credentials=creds)
    now = int(time.time() * 1e9)
    start_time = now - int(10 * 60 * 1e9)
    end_time = now

    body = {
        "dataSourceId": "raw:com.google.blood_pressure:com.google.android.apps.fitness:manual_entry",
        "maxEndTimeNs": end_time,
        "minStartTimeNs": start_time,
        "point": [{
            "startTimeNanos": start_time,
            "endTimeNanos": end_time,
            "dataTypeName": "com.google.blood_pressure",
            "value": [
                {"fpVal": float(sbp)},
                {"fpVal": float(dbp)}
            ]
        }]
    }

    try:
        print(f"🩸 正在写入血压数据（SBP={sbp}, DBP={dbp}）...")
        service.users().dataSources().datasets().patch(
            userId="me",
            dataSourceId="raw:com.google.blood_pressure:com.google.android.apps.fitness:manual_entry",
            datasetId=f"{start_time}-{end_time}",
            body=body
        ).execute()
        print("✅ 写入成功！")
    except Exception as e:
        print(f"❌ 写入失败：{e}")

def get_health_data(client_secret_filename, token_path="token.json", days=30, fields=None):

    creds = authorize(client_secret_filename, token_path)
    service = build('fitness', 'v1', credentials=creds)

    end = datetime.now()
    start = end - timedelta(days=days)
    dataset_id = f"{int(start.timestamp()*1e9)}-{int(end.timestamp()*1e9)}"

    data_sources = {
        "height": {
            "primary": "derived:com.google.height:com.google.android.gms:merge_height",
            "fallback": "raw:com.google.height:com.google.android.apps.fitness:user_input"
        },
        "weight": {
            "primary": "derived:com.google.weight:com.google.android.gms:merge_weight",
            "fallback": "raw:com.google.weight:com.google.android.apps.fitness:user_input"
        },
        "glucose": {
            "primary": "derived:com.google.blood_glucose:com.google.android.gms:merged",
            "fallback": "raw:com.google.blood_glucose:com.google.android.apps.fitness:manual_entry"
        },
        "pressure": {
            "primary": "derived:com.google.blood_pressure:com.google.android.gms:merged",
            "fallback": "raw:com.google.blood_pressure:com.google.android.apps.fitness:manual_entry"
        },
        "sleep": {
            "primary": "derived:com.google.sleep.segment:com.google.android.gms:merged",
            "fallback": "raw:com.google.sleep.segment:com.google.android.apps.fitness:manual_entry"
        }
    }

    fields = fields or list(data_sources.keys())
    results = {}

    for name in fields:
        value = None
        for source_type in ["primary", "fallback"]:
            source_id = data_sources[name][source_type]
            print(f"⏳ Trying {source_type.upper()} → {source_id} for {name}")
            try:
                data = service.users().dataSources().datasets().get(
                    userId="me",
                    dataSourceId=source_id,
                    datasetId=dataset_id
                ).execute()
                points = data.get("point", [])
                values = []
                for p in points:
                    if name == "pressure":
                        values.append(extract_bp(p.get("value", [])))
                    elif name == "sleep":
                        values.append({
                            "start": int(p["startTimeNanos"]),
                            "end": int(p["endTimeNanos"])
                        })
                    else:
                        val = p.get("value", [{}])[0].get("fpVal")
                        values.append(val)
                if values:
                    value = values[-1]
                    break
            except Exception as e:
                print(f" Error accessing {name} from {source_id}: {e}")
                continue
        if name == "sleep" and value:
            results["sleep_time"] = datetime.fromtimestamp(value["start"] / 1e9).strftime("%H:%M")
            results["wake_time"] = datetime.fromtimestamp(value["end"] / 1e9).strftime("%H:%M")
        else:
            results[name] = value

    if results.get("height") and results.get("weight"):
        results["BMI"] = calculate_bmi(results["weight"], results["height"])

    birth_year = get_birth_year(creds.token)
    if birth_year:
        results["age"] = calculate_age(birth_year)

    return results

def run_all(data):
    print("\n Retrieved Data:")
    print(data)
    try:
        height = data.get("height")
        weight = data.get("weight")
        sbp = data.get("systolic")
        dbp = data.get("diastolic")
        glucose = data.get("glucose")
        age = data.get("age")
        bmi = calculate_bmi(weight,height)
        automatic_input_and_predict(age, bmi, glucose, sbp, dbp)
    except Exception as e:
        print("Failed Analysis:", e)

    