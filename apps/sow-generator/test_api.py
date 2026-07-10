import requests
url = "https://script.google.com/macros/s/AKfycbxljo67IVa4l7adQ7d59fI8wIHRfkk4KVR_3gPuCHrw3aT6TMMhNmKK9x44IpQyjDPY/exec?action=get_submissions"
res = requests.get(url, allow_redirects=True)
data = res.json()
print("LOGS:", len(data.get("logs", [])))
if len(data.get("logs", [])) > 0:
    print(data["logs"][0:2])
