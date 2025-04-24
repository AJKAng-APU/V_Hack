from datetime import datetime
import requests

# API Message
GEMINI_API_KEY = "AIzaSyCKe_gsWtvEm7zPLIbEcJ5MmdNV2uxaR6M"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"

# Medication Recommedation
def recommend_medication_time(chronotype):
    if chronotype == "morning":
        return "08:00 - 09:00"
    elif chronotype == "evening":
        return "18:00 - 19:00"
    else:
        return "12:00 - 14:00"

# Sleep Recommendation
def sleep_optimization(chronotype,data):
    current_sleep = data.get("sleep_time")
    current_wake = data.get("wake_time")

    if chronotype == "morning":
        suggestion = "Try sleeping around 22:30 and waking up by 06:30 to align with your chronotype."
    elif chronotype == "evening":
        suggestion = "Consider shifting your sleep to 00:00 - 08:00 for better alignment with your internal rhythm."
    else:
        suggestion = "Maintain a stable sleep schedule around 23:00 - 07:00."

    return f"Your current sleep schedule: {current_sleep} - {current_wake}. Suggestion: {suggestion}"

# Gemini General Recommendation (via API Call)
def generate_circadian_ai_advice(data):
    prompt = f"""
You are a circadian rhythm-aware AI health coach. Based on the data below, provide personalized English advice to optimize this user's daily routine:

- Age: {data.get('age')}
- Chronotype: {data.get('chronotype')}
- Sleep Time: {data.get('sleep_time')}
- Wake Time: {data.get('wake_time')}
- Medication Time: {data.get('medication_time')}
- BMI: {data.get('BMI')}
- Glucose: {data.get('glucose')}
- Blood Pressure: {data.get("systolic")}/{data.get("diastolic")}

Keep it practical, backed by chronobiology, and under 5 lines.
"""

    headers = {"Content-Type": "application/json"}
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    try:
        response = requests.post(GEMINI_URL, headers=headers, json=payload)
        response.raise_for_status()
        gemini_output = response.json()
        return gemini_output["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        return f"Gemini advice error: {e}"


def generate_biorhythm_advice(data, chronotype, medication_time):
    data["chronotype"] = chronotype
    data["medication_time"] = medication_time
    print("\n💊 Recommended Medication Timing:", recommend_medication_time(chronotype))
    print("\n💤 Sleep Recommendation:", sleep_optimization(data))
    print("\n💡 AI Summary:", generate_circadian_ai_advice(data))
