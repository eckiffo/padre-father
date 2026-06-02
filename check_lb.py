import urllib.request, json, ssl
ctx = ssl._create_unverified_context()
url = "https://trenchfather.fun/api/blessing/leaderboard?limit=5"
with urllib.request.urlopen(url, timeout=10, context=ctx) as r:
    data = json.loads(r.read())
    print(json.dumps(data, indent=2))
