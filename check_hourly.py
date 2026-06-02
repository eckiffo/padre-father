import urllib.request, json, ssl
ctx = ssl._create_unverified_context()
url = "https://trenchfather.fun/api/blessing/hourly-stats"
try:
    with urllib.request.urlopen(url, timeout=10, context=ctx) as r:
        data = json.loads(r.read())
        print(json.dumps(data, indent=2))
except Exception as e:
    print("Error:", e)
