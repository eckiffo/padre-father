import base64, json

token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMzQ3ZTkwZS02Mzg4LTRkYWUtYmMzNS0yZjg5NDM4ODA5MjAiLCJleHAiOjE3ODA0NzM4NDF9.nO7Fx4cbHD5Z-dz8M7cYgJiUoDNJcsgytk1r6rL7hck"
refresh = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMzQ3ZTkwZS02Mzg4LTRkYWUtYmMzNS0yZjg5NDM4ODA5MjAiLCJleHAiOjE3ODI4OTMwNDF9.Qx1fGLkr14PVwwJljc24yJKSpZri4b3almbKzNrWlDM"

from datetime import datetime
for name, t in [("ACCESS", token), ("REFRESH", refresh)]:
    payload = t.split('.')[1]
    payload += '=' * (4 - len(payload) % 4)
    data = json.loads(base64.b64decode(payload))
    exp = datetime.utcfromtimestamp(data['exp'])
    now = datetime.utcnow()
    diff = exp - now
    print(f"{name} token expires: {exp} UTC  ({diff.days}d {diff.seconds//3600}h from now)")
