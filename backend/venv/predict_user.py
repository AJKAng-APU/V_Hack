import joblib
import numpy as np
import pandas as pd
import google.generativeai as genai  

genai.configure(api_key="AIzaSyCKe_gsWtvEm7zPLIbEcJ5MmdNV2uxaR6M")

def generate_gemini_advice(record):
    prompt = f"""
You are an AI-powered virtual health assistant with a confident, slightly sassy personality, but backed by solid medical knowledge. 

Based on the following health data, give the user **brief but bold** personalized advice — no sugarcoating. Be clear, be clever, be kind (but with flair). Use confident language like “Let’s be honest,” “Time to face it,” “Good job,” etc.

User Data:
- Age: {record.get("age")}
- BMI: {record.get("BMI")}
- Systolic Blood Pressure: {record.get("SystolicBP")}
- Diastolic Blood Pressure: {record.get("DiastolicBP")}
- Glucose Level: {record.get("Glucose")}
- Health Score (0-100): {record.get("HealthScore")}

🔽 Format:
- Keep it short and sharp (3–5 sentences max)
- Make it sound like a professional who actually *cares* — with just a splash of attitude 😎
- Output in **English**

Now go on, give it to them — with sass and science.
"""
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f" Gemini API error: {e}"


# Load Model and Scaler
try:
    model = joblib.load("model.pkl")
    scaler = joblib.load("scaler.pkl")
except FileNotFoundError:
    print("Model File Not Found. Please Run main.py to Train the Model First.")
    exit(1)




def automatic_input_and_predict(age,bmi,sbp,dbp,glucose):
    print("\n--- Manually Input Health Data ---")
    columns = ["BMI", "SystolicBP", "DiastolicBP", "Glucose", "age"]
    user_data = pd.DataFrame([[bmi, sbp, dbp, glucose, age]], columns=columns)
    user_scaled = scaler.transform(user_data)

    score = int(round(model.predict(user_scaled)[0]))
    record = {
    "age": age,
    "BMI": bmi,
    "SystolicBP": sbp,
    "DiastolicBP": dbp,
    "Glucose": glucose,
    "HealthScore": score
    }


    print("\n Prediction Result：")
    print(f" Health Score：{score}/100")
    print("\n Health Recommendation：")
    print("\n AI Generated Health Advice:")
    advice = generate_gemini_advice(record)
    print(advice)

    if score >= 80:
        print("\nRisk Prediction Result: Low Risk ")
    elif score >= 50:
        print("\nRisk Prediction Result: Moderate Risk ")
    else:
        print("\nRisk Prediction Result: High Risk")



