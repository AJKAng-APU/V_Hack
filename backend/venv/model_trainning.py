import json
import glob
import numpy as np
import joblib
from tqdm import tqdm
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score
from sklearn.model_selection import KFold
from sklearn.metrics import classification_report


def parse_patient_data(file_path):
    """Parse a FHIR patient JSON file and extract relevant health metrics and risk label."""
    with open(file_path, encoding="utf-8") as f:
        data = json.load(f)
    name = "Unknown"
    birth_year = None
    # Find the Patient resource in the FHIR bundle
    patient_entry = next((entry for entry in data.get('entry', []) 
                          if entry['resource']['resourceType'] == 'Patient'), None)
    if patient_entry:
        patient = patient_entry['resource']
        # Construct patient name from given and family names
        if patient.get('name'):
            name_parts = []
            if patient['name'][0].get('given'):
                name_parts += patient['name'][0]['given']
            if patient['name'][0].get('family'):
                name_parts.append(patient['name'][0]['family'])
            name = " ".join(name_parts)
        # Extract birth year for age calculation
        if patient.get('birthDate'):
            birth_year = int(patient['birthDate'].split('-')[0])
    # Initialize health metrics
    latest_height = latest_weight = latest_bmi = None
    latest_sbp = latest_dbp = latest_glucose = None
    has_diabetes = False
    has_hypertension = False
    last_year = None  # track latest year of any record for age calculation

    for entry in data.get('entry', []):
        resource = entry['resource']
        rtype = resource.get('resourceType')
        # Update last_year based on any date field in the resource
        for date_field in ['effectiveDateTime', 'onsetDateTime', 'recordedDate']:
            if date_field in resource:
                try:
                    year = int(resource[date_field][:4])
                    if last_year is None or year > last_year:
                        last_year = year
                except:
                    continue

        if rtype == 'Observation':
            code_info = resource.get('code', {})
            coding_list = code_info.get('coding', [])
            # Determine observation type by code or display text
            code_text = (code_info.get('text') or "").lower()
            display_text = (coding_list[0].get('display') if coding_list else "").lower()
            obs_name = code_text if code_text else display_text
            code_value = coding_list[0].get('code') if coding_list else None

            # Standardized Blood Pressure Parsing with Outlier Filtering
            if rtype == 'Observation':
                code_info = resource.get('code', {})
                coding_list = code_info.get('coding', [])

                if not coding_list:
                    continue

                code_value = coding_list[0].get('code', '')

                # Parse "Blood Pressure Panel" 85354-9
                if code_value == '85354-9':  
                    for comp in resource.get('component', []):
                        comp_code = comp['code']['coding'][0].get('code', '')
                        comp_display = comp['code']['coding'][0].get('display', '').lower()
                        comp_val = comp.get('valueQuantity', {}).get('value')

                        if comp_val is not None:
                            if comp_code == '8480-6' or 'systolic' in comp_display:
                                latest_sbp = float(comp_val)
                            elif comp_code == '8462-4' or 'diastolic' in comp_display:
                                latest_dbp = float(comp_val)

                # Parse "Systolic Blood Pressure Only" 8480-6
                elif code_value == '8480-6':  
                    latest_sbp = float(resource.get('valueQuantity', {}).get('value', 0))

                # Parse "Diastolic Blood Pressure Only" 8462-4
                elif code_value == '8462-4':  
                    latest_dbp = float(resource.get('valueQuantity', {}).get('value', 0))

            # Added: Outlier Filtering to Prevent Extreme Blood Pressure from Affecting Data
            if latest_sbp is not None and (latest_sbp < 80 or latest_sbp > 200):
                latest_sbp = np.nan
            if latest_dbp is not None and (latest_dbp < 50 or latest_dbp > 120):
                latest_dbp = np.nan


            else:
                # Check for other vital measurements
                if 'height' in obs_name and 'body height' in obs_name:
                    # Body Height measurement (in cm)
                    val = resource.get('valueQuantity', {}).get('value')
                    if val is not None:
                        latest_height = float(val)
                elif 'weight' in obs_name and 'body weight' in obs_name:
                    # Body Weight measurement (in kg)
                    val = resource.get('valueQuantity', {}).get('value')
                    if val is not None:
                        latest_weight = float(val)
                elif 'body mass index' in obs_name or 'bmi' in obs_name:
                    # Body Mass Index (BMI)
                    val = resource.get('valueQuantity', {}).get('value')
                    if val is not None:
                        latest_bmi = float(val)
                elif code_value in ['2339-0', '15074-8', '41653-7', '14743-9', '87422-2']:  # Added All Blood Glucose LOINC Codes
                    # 2339-0  = Glucose in Blood
                    # 15074-8 = Glucose [Mass/volume] in Blood
                    # 41653-7 = Glucose [Mass/volume] in Serum or Plasma
                    # 14743-9 = Glucose [Mass/volume] in Capillary Blood
                    # 87422-2 = Glucose [Mass/volume] in Venous Blood

                    val = resource.get('valueQuantity', {}).get('value')
                    record_date = resource.get('effectiveDateTime', '')

                    if val is not None:
                        val = float(val)
                        if 'latest_glucose_date' not in locals():
                            latest_glucose_date = ""

                        if val is not None and record_date:
                            if 'latest_glucose_date' not in locals() or record_date > latest_glucose_date:
                                latest_glucose = val
                                latest_glucose_date = record_date

                    # Filter Abnormal Blood Glucose Values
                    if latest_glucose is not None:
                        if latest_glucose < 10 or latest_glucose > 500:
                            latest_glucose = np.nan  # Prevent Calculation Errors in Pandas




        elif rtype == 'Condition':
            # Identify high-risk conditions (diabetes, hypertension) from condition codes or descriptions
            code = resource.get('code', {})
            cond_text = code.get('text', '')
            if cond_text:
                text_lower = cond_text.lower()
                if 'diabetes' in text_lower:
                    has_diabetes = True
                if 'hypertension' in text_lower:
                    has_hypertension = True
            for cod in code.get('coding', []):
                disp = cod.get('display', '').lower()
                if 'diabetes' in disp:
                    has_diabetes = True
                if 'hypertension' in disp:
                    has_hypertension = True

    # Compute BMI from height and weight if BMI observation is missing
    if latest_bmi is None and latest_height and latest_weight and latest_height > 0:
        latest_bmi = round(latest_weight / ((latest_height / 100) ** 2), 2)
    # Validate BMI to avoid using extreme outliers
    if latest_bmi is not None:
        if latest_bmi < 10 or latest_bmi > 60:
            latest_bmi = None

    # Calculate age (approximate) based on last recorded year
    age = None
    if birth_year and last_year:
        age = last_year - birth_year

    # Generate “Health Score”: High Risk = Low Score, Low Risk = High Score
    if has_diabetes or has_hypertension:
        health_score = np.random.randint(30, 60)  # 30 ~ 59
    else:
        health_score = np.random.randint(80, 100)  # 80 ~ 99

    return {
        "name": name,
        "age": age,
        "BMI": latest_bmi,
        "SystolicBP": latest_sbp,
        "DiastolicBP": latest_dbp,
        "Glucose": latest_glucose,
        "HighRisk": 1 if (has_diabetes or has_hypertension) else 0,  # Add Correct Assignment for HighRisk
        "HealthScore": None  # Leave Blank for Later Assignment by generate_score_label or compute_health_score
    }

def generate_advice(record):
    """Generate a structured health advice string based on a patient's metrics."""
    advice_parts = []
    bmi = record.get("BMI")
    if bmi is not None and not np.isnan(bmi):  # Required Change: Avoid Empty or NaN BMI Values
        if bmi < 18.5:
            advice_parts.append(f"BMI {bmi:.1f} (Underweight) - increase calorie intake for healthy weight.")
        elif bmi < 25:
            advice_parts.append(f"BMI {bmi:.1f} (Normal) - keep up the good work maintaining your weight.")
        elif bmi < 30:
            advice_parts.append(f"BMI {bmi:.1f} (Overweight) - aim for a healthier weight through diet and exercise.")
        else:
            advice_parts.append(f"BMI {bmi:.1f} (Obese) - adopt weight loss strategies (diet, exercise, medical advice).")
    # Blood pressure advice (requires both systolic and diastolic)
    # Required Change: Check if SBP and DBP Are Empty or NaN
    sbp = record.get("SystolicBP")
    dbp = record.get("DiastolicBP")
    if sbp is not None and dbp is not None and not (np.isnan(sbp) or np.isnan(dbp)):  
        # Required Change: Do Not Convert SBP/DBP to int If They Are NaN to Avoid Errors
        sbp = int(sbp)  # Only Convert to Integer After Confirming Value Is Not NaN
        dbp = int(dbp)
        if sbp >= 140 or dbp >= 90:
            advice_parts.append(f"BP {sbp}/{dbp} mmHg (High) - consult a doctor to manage blood pressure.")
        elif sbp >= 130 or dbp >= 80:
            advice_parts.append(f"BP {sbp}/{dbp} mmHg (Elevated) - reduce salt intake and exercise regularly.")
        elif sbp >= 120:
            advice_parts.append(f"BP {sbp}/{dbp} mmHg (Slightly elevated) - maintain a healthy lifestyle.")
        else:
            advice_parts.append(f"BP {sbp}/{dbp} mmHg (Normal) - great job maintaining healthy blood pressure.")
    # Glucose advice
    # Required Change: Check if Blood Glucose Is NaN to Prevent Errors
    glu = record.get("Glucose")
    if glu is not None and not np.isnan(glu):  
        if glu >= 126:
            advice_parts.append(f"Glucose {glu:.2f} mg/dL (High) - monitor blood sugar and consult about diabetes management.")
        elif glu >= 100:
            advice_parts.append(f"Glucose {glu:.2f} mg/dL (Elevated) - improve diet and exercise to avoid diabetes.")
        elif glu < 70:
            advice_parts.append(f"Glucose {glu:.2f} mg/dL (Low) - ensure proper nutrition to avoid low blood sugar.")
        else:
            advice_parts.append(f"Glucose {glu:.2f} mg/dL (Normal) - continue a balanced diet to keep blood sugar stable.")

    return "; ".join(advice_parts) if advice_parts else "No health recommendations (insufficient data)."

def generate_score_label(row):
    """Estimate a Simulated Score Based on Health Metrics (for Training Regression Model)"""
    score = 100

    bmi = row.get("BMI")
    sbp = row.get("SystolicBP")
    dbp = row.get("DiastolicBP")
    glu = row.get("Glucose")
    age = row.get("age")
    high_risk = row.get("HighRisk")

    # Deduct Points for High-Risk Labels First
    if high_risk == 1:
        score -= 25

    # Deduct Points for Abnormally High or Low BMI
    if bmi is not None:
        if bmi < 18.5 or bmi >= 30:
            score -= 10
        elif 25 <= bmi < 30:
            score -= 5

    # Deduct Points for Abnormal Blood Pressure
    if sbp is not None and dbp is not None:
        if sbp >= 140 or dbp >= 90:
            score -= 10
        elif sbp >= 130 or dbp >= 80:
            score -= 5

    # Deduct Points for Abnormal Blood Glucose
    if glu is not None:
        if glu >= 126:
            score -= 10
        elif glu >= 100:
            score -= 5
        elif glu < 70:
            score -= 5

    # Deduct Points for older age(e.g Age Above 60）
    if age is not None:
        if age >= 60:
            score -= 5

    return max(0, min(100, int(score)))  # Ensure Score Stays Within the 0–100 Range


if __name__ == "__main__":
    # Load all patient JSON files in current directory
    files = glob.glob("data/*.json")
    if not files:
        print("No patient data files found. Please ensure JSON files are present.")
        exit(1)
    patient_records = []

    print("Processing patient records...")
    for fp in tqdm(files, desc="Patients", unit="file"):
        try:
            record = parse_patient_data(fp)
            patient_records.append(record)
        except Exception as e:
            # Log the error and continue with next file
            print(f"Error processing {fp}: {e}")
            continue

    if not patient_records:
        print("No valid patient records parsed. Exiting.")
        exit(1)

    # Generate and display medical advice for each patient
    print("\nHealth Recommendations:")
    for rec in patient_records:
        advice_text = generate_advice(rec)
        name = rec.get("name", "Patient")
        if advice_text:
            # Print the patient's name and advice
            print(f"- {name}: {advice_text}")
        else:
            # If no advice could be generated (all data missing), note it
            print(f"- {name}: No health recommendations (insufficient data).")

    # Create a DataFrame for summary stats and modeling (using pandas for convenience)
    import pandas as pd
    df = pd.DataFrame(patient_records)
    df["HealthScore"] = df.apply(generate_score_label, axis=1)

    # Impute missing values with median for numeric columns to prepare for statistics/model
    numeric_cols = ["BMI", "SystolicBP", "DiastolicBP", "Glucose", "age"]
    for col in ["systolic", "diastolic", "glucose", "cholesterol", "age"]:
        if col in df:
        # Fill Missing Values with Median
            df[col] = df[col].fillna(df[col].median())


    # Calculate summary statistics
    num_patients = len(df)
    avg_bmi = df["BMI"].mean() if "BMI" in df else None
    avg_sbp = df["SystolicBP"].mean() if "SystolicBP" in df else None
    avg_dbp = df["DiastolicBP"].mean() if "DiastolicBP" in df else None
    avg_glucose = df["Glucose"].mean() if "Glucose" in df else None
    count_overweight = ((df["BMI"] >= 25) & (df["BMI"] < 30)).sum() if "BMI" in df else 0
    count_obese = (df["BMI"] >= 30).sum() if "BMI" in df else 0
    count_high_bp = ((df["SystolicBP"] >= 130) | (df["DiastolicBP"] >= 80)).sum() if "SystolicBP" in df else 0
    count_high_glucose = (df["Glucose"] >= 100).sum() if "Glucose" in df else 0

    print("\n🔍 Blood Pressure Data Distribution:")
    print(f"Min SystolicBP: {df['SystolicBP'].min()}, Max SystolicBP: {df['SystolicBP'].max()}")
    print(f"Min DiastolicBP: {df['DiastolicBP'].min()}, Max DiastolicBP: {df['DiastolicBP'].max()}")
    print(df[['SystolicBP', 'DiastolicBP']].describe())

    # Display summary statistics
    print("\nSummary Statistics:")
    if avg_bmi is not None:
        print(f"- Average BMI: {avg_bmi:.2f}")
    if avg_sbp is not None and avg_dbp is not None:
        print(f"- Average Blood Pressure: {avg_sbp:.1f}/{avg_dbp:.1f} mmHg")
    if avg_glucose is not None:
        print(f"- Average Glucose: {avg_glucose:.2f} mg/dL")
    print(f"- Overweight patients (BMI 25-29.9): {count_overweight} out of {num_patients}")
    print(f"- Obese patients (BMI >= 30): {count_obese} out of {num_patients}")
    print(f"- Patients with elevated BP (>=130/80): {count_high_bp} out of {num_patients}")
    print(f"- Patients with high blood glucose (>=100 mg/dL): {count_high_glucose} out of {num_patients}")

    # Prepare data for model training
    X = df[["BMI", "SystolicBP", "DiastolicBP", "Glucose", "age"]]
    y = df["HealthScore"]
    model_accuracy = None
    feature_importances = None

    # Step 2: Create HealthScore for Training (Simulated Score)
    # Note: You Can Replace This with a Real Score Provided by a Doctor in the Future
    def compute_health_score(row):
        score = 100

        # BMI Scoring Logic
        bmi = row["BMI"]
        if bmi is not None and not np.isnan(bmi):
            if bmi < 18.5 or bmi > 30:
                score -= 20
            elif bmi < 25:
                score -= 0
            else:
                score -= 10

        # Blood Pressure Scoring Logic
        sbp = row["SystolicBP"]
        dbp = row["DiastolicBP"]
        if not np.isnan(sbp) and not np.isnan(dbp):
            if sbp >= 140 or dbp >= 90:
                score -= 25
            elif sbp >= 130 or dbp >= 80:
                score -= 15
            elif sbp >= 120:
                score -= 5

        # Blood Glucose Scoring Logic
        glu = row["Glucose"]
        if glu is not None and not np.isnan(glu):
            if glu >= 126:
                score -= 25
            elif glu >= 100:
                score -= 15
            elif glu < 70:
                score -= 10

        # Age Impact on Score (Optional Logic)
        if not np.isnan(row["age"]):
            if row["age"] >= 60:
                score -= 10
            elif row["age"] <= 10:
                score -= 5

        # Ensure score in 0-100
        return max(0, min(100, int(score)))

    # Apply to the Entire DataFrame
    df["HealthScore"] = df.apply(compute_health_score, axis=1)

    # wolailehahaha
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)  # Normalize feature data

    # Only train the model if we have at least some positive and some negative cases
    if y is not None:
        try:
            # Split data into training and testing sets (70/30 split)
            X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
            model = RandomForestRegressor(n_estimators=100, random_state=42)
            model.fit(X_train, y_train)
        except ValueError:
            # If stratified split is not possible due to class imbalance, train on full data
            X_train, y_train = X, y
            X_test, y_test = None, None
        # Evaluate model
        if X_test is not None and len(y_test) > 0:
            y_pred = model.predict(X_test)
            mae = mean_absolute_error(y_test, y_pred)
            rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        else:
            # If no test set, use training error as fallback
            y_pred = model.predict(X_train)
            mae = mean_absolute_error(y_train, y_pred)
            rmse = np.sqrt(mean_squared_error(y_train, y_pred))

        # 🌟 Added: Cross-Validation
        kf = KFold(n_splits=5, shuffle=True, random_state=42)
        cross_val_scores = cross_val_score(model, X_scaled, y, cv=kf, scoring="neg_mean_absolute_error")
        cross_val_mean_mae = -np.mean(cross_val_scores)
        print(f"\n📉 Cross Validation MAE: {cross_val_mean_mae:.2f}")
        # Get feature importance scores
        importances = model.feature_importances_
        feature_importances = sorted(zip(X.columns, importances), key=lambda x: x[1], reverse=True)
        joblib.dump(model, "model.pkl")
        joblib.dump(scaler, "scaler.pkl")
        print("\n Model and Scaler Saved as model.pkl and scaler.pkl")

    else:
        model_accuracy = None
        feature_importances = None
        print("Model Training Failed — model.pkl and scaler.pkl Not Saved")

    # Display model performance summary
    print("\nModel Performance:")
    if model_accuracy is not None:
        # Convert accuracy to percentage
        print(f"- Mean Absolute Error (MAE): {mae:.2f}")
        print(f"- Root Mean Squared Error (RMSE): {rmse:.2f}")
    else:
        print("- Random Forest Accuracy: N/A (insufficient class diversity for evaluation)")
    if feature_importances:
        print("- Feature Importance:")
        for feature, importance in feature_importances:
            print(f"   {feature}: {importance * 100:.1f}%")
    else:
        print("- Feature Importance: N/A")