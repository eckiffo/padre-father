import urllib.request, json, ssl
ctx = ssl._create_unverified_context()
url = "https://trenchfather.fun/api/blessing/score?wallet=8YnUQEZY9beCZQMiTcB8wswUrouW6naJj6W3MgCGerVA&refresh=1"
with urllib.request.urlopen(url, timeout=15, context=ctx) as r:
    data = json.loads(r.read())
    print(json.dumps(data, indent=2))
