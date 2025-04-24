from fastapi import FastAPI, HTTPException, Depends, Body, Query, Cookie, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import uvicorn
import os
import json
import time
from datetime import datetime, timedelta

# Import your existing Python modules
# Use try/except to gracefully handle missing modules or credentials
try:
    from health_data import get_health_data, authorize
except Exception as e:
    print(f"Warning: Could not import health_data module: {e}")
    # Create mock functions if imports fail
    def get_health_data(*args, **kwargs):
        return {"mock": "data"}
    def authorize(*args, **kwargs):
        return None

try:
    from biorhythm_advice import generate_biorhythm_advice
except Exception as e:
    print(f"Warning: Could not import biorhythm_advice module: {e}")
    def generate_biorhythm_advice(*args, **kwargs):
        print("Using mock biorhythm advice generator")
        return "Mock biorhythm advice"

try:
    from environment_advice import get_environment_health_advice
except Exception as e:
    print(f"Warning: Could not import environment_advice module: {e}")
    def get_environment_health_advice(*args, **kwargs):
        return "Maintain good indoor air quality and stay hydrated."

try:
    from predict_user import automatic_input_and_predict
except Exception as e:
    print(f"Warning: Could not import predict_user module: {e}")
    def automatic_input_and_predict(*args, **kwargs):
        return {"mock": "prediction"}

# Initialize FastAPI app
app = FastAPI(title="Health Assistant API", 
              description="API for health data integration and AI insights",
              version="1.0.0")

# Add CORS middleware with specific origin instead of wildcard
# This is important for cookies and credentials to work properly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Specify your frontend URL here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models for request/response data
class GoogleFitAuthRequest(BaseModel):
    authCode: str

class ChronotypeRequest(BaseModel):
    chronotype: str
    medicationTime: str

class SymptomData(BaseModel):
    symptom: str
    severity: str
    time: str
    date: str
    duration: Optional[str] = None
    notes: Optional[str] = None
    triggers: List[str] = []
    associatedSymptoms: List[str] = []
    timeOfDay: str
    healthContext: Optional[Dict[str, Any]] = None

class HealthMetrics(BaseModel):
    age: Optional[int] = None
    BMI: Optional[float] = None
    glucose: Optional[float] = None
    sbp: Optional[float] = None  # systolic blood pressure
    dbp: Optional[float] = None  # diastolic blood pressure

# In-memory storage (in a real app, you'd use a database)
symptoms_db = []
session_tokens = {}

# Simulated auth middleware
def get_current_user(request: Request):
    # In a real app, validate the session token from cookies
    # For demo purposes, we'll just return a demo user
    return {"id": 1, "name": "Demo User"}

# Helper function to check if Google credential file exists
def check_google_credentials():
    """Check if Google credential file exists"""
    credential_file = "client_secret_312973657682-6p2qaf35702am9bh8drvullabafo30lh.apps.googleusercontent.com.json"
    mock_file = "client_secret.json"
    
    if os.path.exists(credential_file):
        return credential_file
    elif os.path.exists(mock_file):
        return mock_file
    else:
        return None

# Routes
@app.get("/api/health")
def health_check():
    """Health check endpoint to verify the API is running"""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.post("/api/auth/google-fit")
def authenticate_google_fit(auth_data: GoogleFitAuthRequest):
    """Authenticate with Google Fit using the provided authorization code"""
    try:
        # In a real app, this would exchange the auth code for tokens
        # For demo purposes, we'll just simulate success
        token = f"demo_token_{int(time.time())}"
        session_tokens[token] = {"created": datetime.now()}
        
        return {
            "success": True,
            "message": "Successfully authenticated with Google Fit",
            "token": token
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")

@app.get("/api/health-data")
def fetch_health_data(
    days: int = Query(30, description="Number of days to fetch data for"),
    fields: Optional[List[str]] = Query(None, description="Specific fields to fetch"),
    current_user: dict = Depends(get_current_user)
):
    """Fetch health data from Google Fit"""
    try:
        # Check if Google credential file exists
        credential_file = check_google_credentials()
        
        if credential_file:
            # Use your existing Python function
            try:
                data = get_health_data(
                    client_secret_filename=credential_file, 
                    fields=fields if fields else ["pressure", "weight", "height", "glucose"]
                )
            except Exception as e:
                print(f"Error using Google API: {e}")
                data = {}
        else:
            # Generate mock data if credential file doesn't exist
            data = {}
            print("Generating mock health data (no Google credentials)")
        
        # Process the return data to handle nested objects
        processed_data = {}
        for key, value in data.items():
            if key == "pressure" and isinstance(value, tuple) and len(value) == 2:
                processed_data["systolic"] = value[0]
                processed_data["diastolic"] = value[1]
            else:
                processed_data[key] = value
        
        # Add some mock data for demo purposes
        if not processed_data.get("age"):
            processed_data["age"] = 35
            
        if not processed_data.get("sleep_time"):
            processed_data["sleep_time"] = "23:30"
            
        if not processed_data.get("wake_time"):
            processed_data["wake_time"] = "07:15"
            
        if not processed_data.get("height"):
            processed_data["height"] = 1.75
            
        if not processed_data.get("weight"):
            processed_data["weight"] = 70.5
            
        if not processed_data.get("BMI"):
            processed_data["BMI"] = 23.0
            
        if not processed_data.get("systolic"):
            processed_data["systolic"] = 120
            
        if not processed_data.get("diastolic"):
            processed_data["diastolic"] = 80
            
        if not processed_data.get("glucose"):
            processed_data["glucose"] = 95
        
        return processed_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch health data: {str(e)}")

@app.post("/api/prediction")
def get_prediction(metrics: HealthMetrics, current_user: dict = Depends(get_current_user)):
    """Get health prediction based on provided metrics"""
    try:
        # Calculate health score and generate advice
        health_score = calculate_health_score(metrics)
        
        return {
            "HealthScore": health_score,
            "riskLevel": "Low Risk" if health_score >= 80 else "Moderate Risk" if health_score >= 50 else "High Risk",
            "advice": get_mock_advice(health_score)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate prediction: {str(e)}")

# Changed to GET method to avoid CORS preflight issues
@app.get("/api/biorhythm/advice")
def get_biorhythm_advice(
    chronotype: str = Query(..., description="User's chronotype (e.g., morning, evening)"),
    medicationTime: str = Query(..., description="Preferred medication time"),
    current_user: dict = Depends(get_current_user)
):
    """Get biorhythm advice based on chronotype"""
    try:
        # Generate medication time recommendation
        if chronotype.lower() == "morning":
            med_time = "08:00 - 09:00"
        elif chronotype.lower() == "evening":
            med_time = "18:00 - 19:00"
        else:
            med_time = "12:00 - 14:00"
            
        # Generate sleep recommendation
        if chronotype.lower() == "morning":
            sleep_suggestion = "Try sleeping around 22:30 and waking up by 06:30 to align with your chronotype."
        elif chronotype.lower() == "evening":
            sleep_suggestion = "Consider shifting your sleep to 00:00 - 08:00 for better alignment with your internal rhythm."
        else:
            sleep_suggestion = "Maintain a stable sleep schedule around 23:00 - 07:00."
            
        sleep_advice = f"Suggestion: {sleep_suggestion}"
        
        # Get general advice
        general_advice = "Align your daily activities with your natural chronotype for optimal performance and wellbeing."
        
        # Try to get environment advice as additional context
        try:
            env_advice = get_environment_health_advice()
            if env_advice:
                general_advice += f" {env_advice}"
        except Exception as e:
            print(f"Could not get environment advice: {e}")
        
        return {
            "chronotype": chronotype,
            "medicationTime": med_time,
            "sleepAdvice": sleep_advice,
            "generalAdvice": general_advice
        }
    except Exception as e:
        # Log the actual error for debugging
        print(f"Error in biorhythm advice: {str(e)}")
        
        # Return a fallback response
        return {
            "chronotype": chronotype,
            "medicationTime": "08:00 - 09:00" if chronotype.lower() == "morning" else "18:00 - 19:00" if chronotype.lower() == "evening" else "12:00 - 14:00",
            "sleepAdvice": "Maintain a consistent sleep schedule aligned with your chronotype.",
            "generalAdvice": "Align daily activities with your natural energy rhythms."
        }

@app.post("/api/symptoms")
def submit_symptom(symptom_data: SymptomData, current_user: dict = Depends(get_current_user)):
    """Submit a new symptom with optional health context"""
    try:
        # Generate a new ID
        new_id = len(symptoms_db) + 1
        
        # Create the symptom record
        symptom_record = symptom_data.dict()
        symptom_record["id"] = new_id
        symptom_record["user_id"] = current_user["id"]
        symptom_record["created_at"] = datetime.now().isoformat()
        
        # Store it (in a real app, this would go to a database)
        symptoms_db.append(symptom_record)
        
        return symptom_record
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit symptom: {str(e)}")

@app.post("/api/ai/insights")
def get_ai_insights(data: dict = Body(...), current_user: dict = Depends(get_current_user)):
    """Get AI-generated insights based on symptoms and health metrics"""
    try:
        symptom = data.get("symptom", {})
        health_metrics = data.get("healthMetrics", {})
        
        # Generate insights based on the symptom
        symptom_name = symptom.get("symptom", "").lower()
        severity = symptom.get("severity", "").lower()
        time_of_day = symptom.get("timeOfDay", "").lower()
        
        # Generate insights based on the symptom
        insights = generate_insights(symptom_name, severity, time_of_day, health_metrics)
        
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate AI insights: {str(e)}")

# New endpoint for environment health advice
@app.get("/api/environment/advice")
def environment_advice(current_user: dict = Depends(get_current_user)):
    """Get environment-based health advice"""
    try:
        try:
            advice = get_environment_health_advice()
        except Exception as e:
            advice = "Maintain good indoor air quality with proper ventilation. Stay hydrated throughout the day."
            print(f"Error getting environment advice: {e}")
            
        return {
            "advice": advice or "Maintain good indoor air quality with proper ventilation. Stay hydrated throughout the day.",
            "aqi": 2,  # Mock Air Quality Index
            "weather": "Partly cloudy, 22°C"  # Mock weather data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate environment advice: {str(e)}")

# Helper functions

def calculate_health_score(metrics: HealthMetrics) -> int:
    """Calculate a health score from 0-100 based on the metrics"""
    score = 100
    
    # Deduct for abnormal BMI
    if metrics.BMI:
        if metrics.BMI < 18.5 or metrics.BMI >= 30:
            score -= 15
        elif metrics.BMI >= 25:
            score -= 10
    
    # Deduct for abnormal blood pressure
    if metrics.sbp and metrics.dbp:
        if metrics.sbp >= 140 or metrics.dbp >= 90:
            score -= 15
        elif metrics.sbp >= 130 or metrics.dbp >= 80:
            score -= 10
    
    # Deduct for abnormal glucose
    if metrics.glucose:
        if metrics.glucose >= 126:
            score -= 15
        elif metrics.glucose >= 100:
            score -= 10
    
    # Ensure score stays within 0-100
    return max(0, min(100, score))

def get_mock_advice(score: int) -> str:
    """Get appropriate health advice based on health score"""
    if score >= 80:
        return "You're in great shape! Keep up your healthy habits and regular check-ups. Consider adding more strength training to your fitness routine."
    elif score >= 60:
        return "You're doing well, but there's room for improvement. Focus on managing stress and ensuring you're getting enough sleep and regular physical activity."
    elif score >= 40:
        return "Let's be honest — your health metrics suggest some concerns. Prioritize regular exercise, a balanced diet, and speaking with a healthcare provider."
    else:
        return "Time to face it: your current health metrics require immediate attention. Please consult with a healthcare provider and make lifestyle changes right away."

def generate_insights(symptom: str, severity: str, time_of_day: str, metrics: dict) -> dict:
    """Generate AI insights based on symptom and health metrics"""
    insights = {
        "pattern": None,
        "recommendation": None,
        "relatedMetrics": []
    }
    
    # Headache insights
    if "headache" in symptom:
        bp_systolic = metrics.get("pressure", {}).get("systolic", 0)
        if time_of_day in ["morning", "afternoon"] and bp_systolic > 130:
            insights["pattern"] = "Your headaches tend to occur when your blood pressure is elevated. Morning and afternoon headaches can be related to blood pressure fluctuations."
            insights["recommendation"] = "Consider monitoring your blood pressure more regularly. Stay hydrated and limit caffeine intake, especially in the morning."
            insights["relatedMetrics"].append("blood pressure")
        elif "evening" in time_of_day or "night" in time_of_day:
            insights["pattern"] = "Your evening headaches may be related to screen time or eye strain throughout the day. Blue light exposure can disrupt sleep patterns."
            insights["recommendation"] = "Try the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds. Consider blue light blocking glasses in the evening."
        else:
            insights["pattern"] = "Your headaches don't show a clear pattern yet. Keep logging them and we'll analyze for triggers."
            insights["recommendation"] = "Track water intake, stress levels, and screen time alongside your headaches to identify potential triggers."
    
    # Fatigue insights
    elif "fatigue" in symptom or "tired" in symptom:
        glucose = metrics.get("glucose")
        if glucose:
            if glucose > 100:
                insights["pattern"] = "Your fatigue may be related to elevated blood glucose levels, which can cause energy fluctuations."
                insights["recommendation"] = "Consider eating smaller, more frequent meals to stabilize blood sugar. Limit refined carbohydrates and sugars."
                insights["relatedMetrics"].append("glucose")
            else:
                insights["pattern"] = "Your fatigue doesn't appear to be related to blood glucose levels, which are within normal range."
        
        if metrics.get("sleep"):
            insights["pattern"] = (insights["pattern"] or "") + " Your sleep schedule may be contributing to your fatigue levels."
            insights["recommendation"] = (insights["recommendation"] or "") + " Try to maintain a consistent sleep schedule, even on weekends."
            insights["relatedMetrics"].append("sleep")
    
    # Dizziness insights
    elif "dizz" in symptom or "light-headed" in symptom:
        bp = metrics.get("pressure", {})
        systolic = bp.get("systolic")
        diastolic = bp.get("diastolic", 0)
        
        if systolic and systolic < 100:
            insights["pattern"] = "Your dizziness may be related to lower blood pressure readings."
            insights["recommendation"] = "Stay hydrated and rise slowly from sitting or lying positions. Consider adding more salt to your diet if approved by your doctor."
            insights["relatedMetrics"].append("blood pressure")
        elif systolic and (systolic > 140 or diastolic > 90):
            insights["pattern"] = "Your dizziness occurs with elevated blood pressure, which can sometimes be related."
            insights["recommendation"] = "This combination of symptoms should be discussed with your doctor at your next visit."
            insights["relatedMetrics"].append("blood pressure")
    
    # Default insights
    if not insights["pattern"]:
        insights["pattern"] = f"We're monitoring your {symptom} and looking for patterns with your health data."
        insights["recommendation"] = "Continue logging your symptoms, especially noting severity and time of day, to help identify triggers and patterns."
    
    return insights

# Run the application
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)