import sys
import json
import urllib.request
from pathlib import Path

img_path = Path(r"C:\Users\naksh\.gemini\antigravity\brain\14475d51-5939-410a-bad2-68c95c87bb35\.user_uploaded\media_1786686525044.jpg")
with open(img_path, "rb") as f:
    img_bytes = f.read()

boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
body = bytearray()
body.extend(f"--{boundary}\r\n".encode("utf-8"))
body.extend(b'Content-Disposition: form-data; name="file"; filename="media_1786686525044.jpg"\r\n')
body.extend(b"Content-Type: image/jpeg\r\n\r\n")
body.extend(img_bytes)
body.extend(b"\r\n")
body.extend(f"--{boundary}\r\n".encode("utf-8"))
body.extend(b'Content-Disposition: form-data; name="crop_hint"\r\n\r\n')
body.extend(b"Tomato\r\n")
body.extend(f"--{boundary}--\r\n".encode("utf-8"))

req = urllib.request.Request(
    "http://127.0.0.1:5000/api/v1/ai/analyze",
    data=bytes(body),
    headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    method="POST"
)

with urllib.request.urlopen(req, timeout=10) as resp:
    data = json.loads(resp.read().decode("utf-8"))
    print("LIVE API RESPONSE:")
    print(json.dumps(data, indent=2))
