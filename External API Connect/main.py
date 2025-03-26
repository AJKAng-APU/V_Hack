import requests
import time
import json
from google_auth_oauthlib.flow import InstalledAppFlow

# Google Fit API 权限范围
SCOPES = ["https://www.googleapis.com/auth/fitness.activity.read"]

# 读取 OAuth 2.0 客户端 JSON 文件
flow = InstalledAppFlow.from_client_secrets_file(
    "client_secret_293822294927-8sm08cvjnan3shh0vknerp2qe8es4v9h.apps.googleusercontent.com.json", 
    SCOPES
)

# 运行 OAuth 认证（会弹出 Google 登录窗口）
creds = flow.run_local_server(port=0)

# 获取 Access Token 和 Refresh Token
print("✅ 获取 Access Token:", creds.token)
print("✅ 获取 Refresh Token:", creds.refresh_token)

# ✅ 将 Refresh Token 保存到 `refresh_token.txt`
with open("refresh_token.txt", "w") as f:
    f.write(creds.refresh_token)

print("✅ 授权成功！Refresh Token 已保存到 `refresh_token.txt` 🎉")

# 加载 OAuth 2.0 客户端信息
with open("client_secret_293822294927-8sm08cvjnan3shh0vknerp2qe8es4v9h.apps.googleusercontent.com.json") as f:
    client_info = json.load(f)["installed"]

CLIENT_ID = client_info["client_id"]
CLIENT_SECRET = client_info["client_secret"]
TOKEN_URL = "https://oauth2.googleapis.com/token"

# 读取 Refresh Token（第一次获取后会存入 refresh_token.txt）
with open("refresh_token.txt") as f:
    REFRESH_TOKEN = f.read().strip()

# 函数：自动获取新的 Access Token
def get_access_token():
    payload = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "refresh_token": REFRESH_TOKEN,
        "grant_type": "refresh_token"
    }

    response = requests.post(TOKEN_URL, data=payload)
    access_token = response.json().get("access_token")

    if access_token:
        print("✅ 获取 Access Token 成功！")
        return access_token
    else:
        print("❌ 获取 Access Token 失败:", response.json())
        return None

# 获取 Access Token
ACCESS_TOKEN = get_access_token()

# 如果获取失败，则退出
if not ACCESS_TOKEN:
    exit()

# ✅ 计算时间范围（过去 24 小时）
END_TIME_MS = int(time.time() * 1000)
START_TIME_MS = END_TIME_MS - (24 * 60 * 60 * 1000)

# ✅ 发送 Google Fit API 请求
url = "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate"
headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json"
}

body = {
    "aggregateBy": [{"dataTypeName": "com.google.step_count.delta"}],
    "bucketByTime": {"durationMillis": 86400000},  # 1 天
    "startTimeMillis": START_TIME_MS,
    "endTimeMillis": END_TIME_MS
}

response = requests.post(url, headers=headers, json=body)

# ✅ 处理 API 响应
if response.status_code == 200:
    print("✅ 步数数据获取成功！")
    print(response.json())  # 显示步数数据
else:
    print("❌ 获取步数数据失败:", response.status_code, response.text)

