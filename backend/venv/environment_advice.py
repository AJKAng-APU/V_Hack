# environment_advice.py
import requests
import google.generativeai as genai

# get current ip location
def get_ip_location():
    try:
        response = requests.get("https://ipinfo.io/json")
        if response.status_code == 200:
            data = response.json()
            loc = data.get("loc", "")
            if loc:
                lat, lon = map(float, loc.split(","))
                return lat, lon
        return None
    except Exception as e:
        print("Error Message：", e)
        return None

# get surrounding enviroment
def get_environment_data(lat, lon, api_key):
    result = {}
    
    # get AQI data
    aqi_url = f"https://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={api_key}"
    res = requests.get(aqi_url)
    if res.status_code == 200:
        aqi_data = res.json()
        result["aqi"] = aqi_data["list"][0]["main"]["aqi"]

    # get weather data
    weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    res = requests.get(weather_url)
    if res.status_code == 200:
        w = res.json()
        result["weather"] = f"{w['weather'][0]['description'].capitalize()}, {w['main']['temp']}°C"

    return result

# construct prompt
def generate_environment_advice_prompt(env_data):
    prompt = f"""
You are an environmental health advisor. Based on the following real-time environmental data, provide personalized health advice. Mention specific risks related to air quality, heat, or extreme weather.

🌎 Environment Data:
- Air Quality Index (AQI): {env_data.get('aqi')} (1=Good, 5=Very Poor)
- Weather: {env_data.get('weather')}

Provide helpful advice for outdoor activity, breathing, hydration, and general well-being. Use a friendly tone.
"""
    return prompt.strip()

# Use Gemini to get advice
def get_environment_health_advice():
    OPENWEATHERMAP_API_KEY = "97fdf08e5a5b60a36b8fc0a32e768646"
    GEMINI_API_KEY = "AIzaSyCKe_gsWtvEm7zPLIbEcJ5MmdNV2uxaR6M"
    location = get_ip_location()
    if location:
        env_data = get_environment_data(location[0], location[1], OPENWEATHERMAP_API_KEY)
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")
        prompt = generate_environment_advice_prompt(env_data)
        response = model.generate_content(prompt)
        return response.text
    else:
        return None
