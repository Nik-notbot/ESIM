import base64, json, os, urllib.request, ssl
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.hashes import SHA256
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

API_KEY = "d6230379e0d981548044254461b54be666d478709d9a0d36e14b6a5087fb503c"
URL = "https://gw.globalstatic-node.com"
PHONE = "+1519629310"
RID = "89451"

_aes_key = HKDF(
    algorithm=SHA256(), length=32,
    salt=b"fanytel-api-v1", info=b"aes-key",
).derive(API_KEY.encode())

print("AES key (hex):", _aes_key.hex())

def _encrypt(data):
    nonce = os.urandom(12)
    ct = AESGCM(_aes_key).encrypt(nonce, json.dumps(data).encode(), None)
    return base64.urlsafe_b64encode(nonce + ct).decode()

def _decrypt(b64):
    raw = base64.urlsafe_b64decode(b64)
    return json.loads(AESGCM(_aes_key).decrypt(raw[:12], raw[12:], None))

def call(endpoint, extra=None):
    payload = {"phone": PHONE, "rid": RID}
    if extra:
        payload.update(extra)
    body = _encrypt(payload)
    req = urllib.request.Request(
        URL + endpoint,
        data=body.encode(),
        headers={
            "X-API-Key": API_KEY,
            "Content-Type": "application/octet-stream",
            "User-Agent": "Mozilla/5.0",
        },
        method="POST",
    )
    ctx = ssl.create_default_context()
    try:
        resp = urllib.request.urlopen(req, context=ctx)
        result = _decrypt(resp.read().decode())
        return result
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read().decode()[:500]}")
        return None

print("\n=== Test 1: Balance ===")
r = call("/account/balance")
print(json.dumps(r, indent=2, ensure_ascii=False))

print("\n=== Test 2: id-exists ===")
r = call("/account/id-exists", {"target": PHONE})
print(json.dumps(r, indent=2, ensure_ascii=False))
