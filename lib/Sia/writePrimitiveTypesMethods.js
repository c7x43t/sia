import SIA_TYPES from "../types.js";
import utfz from "@valentech/utfz-lib";

function addOString(string) {
    this.writeUInt8(SIA_TYPES.ostring);
    this.addString(string)
}
function addString(string) {
    const { length } = string;
    // See benchmarks/string/both
    if (length < 60) {
        // this does notperform buffer grow checks
        this.writeUInt8(SIA_TYPES.utfz);
        const byteLength = utfz.pack(
            string,
            length,
            this.buffer,
            this.offset + 1
        );
        this.buffer.writeUInt8(byteLength, this.offset);
        this.offset += byteLength + 1;
        return;
    }
    const maxBytes = length * 3;
    if (maxBytes < 0x100) {
        this.writeUInt8(SIA_TYPES.string8);
        const byteLength = this.writeString(string, this.offset + 1);
        this.buffer.writeUInt8(byteLength, this.offset);
        this.offset += byteLength + 1;
    } else if (maxBytes < 0x10000) {
        this.writeUInt8(SIA_TYPES.string16);
        const byteLength = this.writeString(string, this.offset + 2);
        this.buffer.writeUInt16LE(byteLength, this.offset);
        this.offset += byteLength + 2;
    } else {
        this.writeUInt8(SIA_TYPES.string32);
        const byteLength = this.writeString(string, this.offset + 4);
        this.buffer.writeUInt32LE(byteLength, this.offset);
        this.offset += byteLength + 4;
    }
}
function addRef(ref) {
    if (ref < 0x100) {
        this.writeUInt8(SIA_TYPES.ref8);
        this.writeUInt8(ref);
    } else if (ref < 0x10000) {
        this.writeUInt8(SIA_TYPES.ref16);
        this.writeUInt16(ref);
    } else if (ref < 0x100000000) {
        this.writeUInt8(SIA_TYPES.ref32);
        this.writeUInt32(ref);
    } else {
        throw `Ref size ${ref} is too big`;
    }
}
function addORef(ref) {
    if (ref < 0x100) {
        this.writeUInt8(SIA_TYPES.oref8);
        this.writeUInt8(ref);
    } else if (ref < 0x10000) {
        this.writeUInt8(SIA_TYPES.oref16);
        this.writeUInt16(ref);
    } else if (ref < 0x100000000) {
        this.writeUInt8(SIA_TYPES.oref32);
        this.writeUInt32(ref);
    } else {
        throw `Object Ref size ${ref} is too big`;
    }
}
function addNumber(number) {
    // TODO: make this faster https://jsben.ch/26igA
    if (Number.isInteger(number)) return this.addInteger(number);
    return this.addFloat(number);
}
const big_zero = BigInt(0);
const big_one = BigInt(1);
const big_8 = BigInt(8);
const big2p8m1 = BigInt(2 ** 8 - 1); // 0xFFn
const big_16 = BigInt(16);
const big_2p16m1 = BigInt(2 ** 16 - 1); // 0xFFFFn
const big_32 = BigInt(32);
const big_2p32m1 = BigInt(2 ** 32 - 1); // 0xFFFFFFFFn

const big_64 = BigInt(64);
const big_0x100 = BigInt(0x100);
const big_0x10000 = BigInt(0x10000);
const big_0x100000000 = BigInt(0x100000000);
const big_m0x80 = BigInt(-0x80);
const big_m0x8000 = BigInt(-0x8000);
const big_m0x80000000 = BigInt(-0x80000000);
const big_max_safe_int = 18446744073709551615n;
const big_min_safe_int = BigInt(Number.MIN_SAFE_INTEGER);
function addBigInt(number) {
    if (number < big_zero) {
        if (number >= big_m0x80) {
            this.writeUInt8(SIA_TYPES.bigint8);
            this.writeInt8(Number(number));
            return;
        } else if (number >= big_m0x8000) {
            this.writeUInt8(SIA_TYPES.bigint16);
            this.writeInt16(Number(number));
            return;
        } else if (number >= big_m0x80000000) {
            this.writeUInt8(SIA_TYPES.bigint32);
            this.writeInt32(Number(number));
            return;
        } else if (number >= big_min_safe_int) {
            this.writeUInt8(SIA_TYPES.bigint64);
            this.writeBigInt64(number);
            return;
        } else {
            this.writeUInt8(SIA_TYPES.bigintN);
            number = -number;
            // from here it is the same as positive bigint
        }
    } else {
        if (number < big_0x100) {
            this.writeUInt8(SIA_TYPES.biguint8);
            this.writeUInt8(Number(number));
            return;
        } else if (number < big_0x10000) {
            this.writeUInt8(SIA_TYPES.biguint16);
            this.writeUInt16(Number(number));
            return;
        } else if (number < big_0x100000000) {
            this.writeUInt8(SIA_TYPES.biguint32);
            this.writeUInt32(Number(number));
            return;
        } else if (number <= big_max_safe_int) {
            this.writeUInt8(SIA_TYPES.biguint64);
            this.writeBigUInt64(number);
            return;
        } else {
            this.writeUInt8(SIA_TYPES.biguintN);
        }
    }
    // > 64 bit long bigints
    let length = 0;
    while (number > big_zero) {
        const chunk = BigInt.asUintN(64, number);
        this.writeBigUInt64AtOffset(chunk, this.offset + 8 * length + 1);
        number -= chunk;
        number >>= big_64;
        length++;
    }
    this.buffer.writeUInt8(length, this.offset);
    this.offset += 8 * (length) + 1;
}

function addInteger(number) {
    if (number < 0) {
        if (number >= -0x80) {
            this.writeUInt8(SIA_TYPES.int8);
            this.writeInt8(number);
        } else if (number >= -0x8000) {
            this.writeUInt8(SIA_TYPES.int16);
            this.writeInt16(number);
        } else if (number >= -0x80000000) {
            this.writeUInt8(SIA_TYPES.int32);
            this.writeInt32(number);
        } else {
            this.addFloat(number);
        }
    } else {
        if (number < 0x100) {
            this.writeUInt8(SIA_TYPES.uint8);
            this.writeUInt8(number);
        } else if (number < 0x10000) {
            this.writeUInt8(SIA_TYPES.uint16);
            this.writeUInt16(number);
        } else if (number < 0x100000000) {
            this.writeUInt8(SIA_TYPES.uint32);
            this.writeUInt32(number);
        } else {
            this.addFloat(number);
        }
    }
}
function addFloat(number) {
    this.writeUInt8(SIA_TYPES.float64);
    this.writeDouble(number);
}
function addONumber(number) {
    this.writeUInt8(SIA_TYPES.onumber);
    // TODO: make this faster https://jsben.ch/26igA
    this.addNumber(+number);
}
function addRegExp(regexp) {
    this.writeUInt8(SIA_TYPES.regexp);
    const encodedFlags = (regexp.global << 0) | // 2^0 = 1
        (regexp.ignoreCase << 1) | // 2^1 = 2
        (regexp.multiline << 2) | // 2^2 = 4
        (regexp.unicode << 3) | // 2^3 = 8
        (regexp.sticky << 4); // 2^4 = 16
    // encoding via custom type was: [item.source, encodedFlags]
    // we can get rid of the array wrapper and the uint8 type byte, since it is implicit
    this.writeInt8(encodedFlags);
    this.addString(regexp.source);
}
function addDate(date) {
    this.writeUInt8(SIA_TYPES.date);
    this.writeDouble(date.getTime());
}
function startArray(length) {
    if (length < 0x100) {
        this.writeUInt8(SIA_TYPES.array8);
        this.writeUInt8(length);
    } else if (length < 0x10000) {
        this.writeUInt8(SIA_TYPES.array16);
        this.writeUInt16(length);
    } else if (length < 0x100000000) {
        this.writeUInt8(SIA_TYPES.array32);
        this.writeUInt32(length);
    } else {
        throw `Array of size ${length} is too big to serialize`;
    }
}
function startObject() {
    this.writeUInt8(SIA_TYPES.objectStart);
}
function endObject() {
    this.writeUInt8(SIA_TYPES.objectEnd);
}
function startMap() {
    this.writeUInt8(SIA_TYPES.mapStart);
}
function endMap() {
    this.writeUInt8(SIA_TYPES.mapEnd);
}
function startSet() {
    this.writeUInt8(SIA_TYPES.setStart);
}
function endSet() {
    this.writeUInt8(SIA_TYPES.setEnd);
}
function addBoolean(bool) {
    const type = bool ? SIA_TYPES.true : SIA_TYPES.false;
    this.writeUInt8(type);
}
function addOBoolean(bool) {
    const type = bool ? SIA_TYPES.otrue : SIA_TYPES.ofalse;
    this.writeUInt8(type);
}
function addNull() {
    this.writeUInt8(SIA_TYPES.null);
}
function addONull() {
    this.writeUInt8(SIA_TYPES.onull);
}
function addUndefined() {
    this.writeUInt8(SIA_TYPES.undefined);
}
function addCustomType(item, constructor) {
    const { args, code } = this.itemToSia(item, constructor);
    if (code < 0x100) {
        this.writeUInt8(SIA_TYPES.constructor8);
        this.writeUInt8(code);
    } else if (code < 0x10000) {
        this.writeUInt8(SIA_TYPES.constructor16);
        this.writeUInt16(code);
    } else if (code < 0x100000000) {
        this.writeUInt8(SIA_TYPES.constructor32);
        this.writeUInt32(code);
    } else {
        throw `Code ${code} too big for a constructor`;
    }
    this.serializeItem(args);
}
function addBuffer(item) {
    const { length } = item;
    if (item.length < 0x100) {
        this.writeUInt8(SIA_TYPES.bin8);
        this.writeUInt8(length);
        item.copy(this.buffer, this.offset);
        this.offset += length;
    } else if (item.length < 0x10000) {
        this.writeUInt8(SIA_TYPES.bin16);
        this.writeUInt16(length);
        item.copy(this.buffer, this.offset);
        this.offset += length;
    } else if (item.length < 0x100000000) {
        this.writeUInt8(SIA_TYPES.bin32);
        this.writeUInt32(length);
        item.copy(this.buffer, this.offset);
        this.offset += length;
    } else {
        throw `Buffer of size ${length} is too big to serialize`;
    }
}
function addArrayBuffer(item) {
    const { byteLength } = item;
    if (byteLength < 0x100) {
        this.writeUInt8(SIA_TYPES.bin8);
        this.writeUInt8(byteLength);
        new Uint8Array(item).forEach((byte) => {
            this.writeUInt8(byte);
        });
    } else if (byteLength < 0x10000) {
        this.writeUInt8(SIA_TYPES.bin16);
        this.writeUInt16(byteLength);
        new Uint8Array(item).forEach((byte) => {
            this.writeUInt8(byte);
        });
    } else if (byteLength < 0x100000000) {
        this.writeUInt8(SIA_TYPES.bin32);
        this.writeUInt32(byteLength);
        new Uint8Array(item).forEach((byte) => {
            this.writeUInt8(byte);
        });
    } else {
        throw `ArrayBuffer of size ${byteLength} is too big to serialize`;
    }
}
function addInt8Array(item) {
    const { length } = item;
    if (item.length < 0x100) {
        this.writeUInt8(SIA_TYPES.int8array8);
        this.writeUInt8(length);
    } else if (item.length < 0x10000) {
        this.writeUInt8(SIA_TYPES.int8array16);
        this.writeUInt16(length);
    } else if (item.length < 0x100000000) {
        this.writeUInt8(SIA_TYPES.int8array32);
        this.writeUInt32(length);
    } else {
        throw `Buffer of size ${length} is too big to serialize`;
    }
    item.copy(this.buffer, this.offset);
    this.offset += length;
}
function addUint8Array(item) {
    const { length } = item;
    if (item.length < 0x100) {
        this.writeUInt8(SIA_TYPES.uint8array8);
        this.writeUInt8(length);
    } else if (item.length < 0x10000) {
        this.writeUInt8(SIA_TYPES.uint8array16);
        this.writeUInt16(length);
    } else if (item.length < 0x100000000) {
        this.writeUInt8(SIA_TYPES.uint8array32);
        this.writeUInt32(length);
    } else {
        throw `Buffer of size ${length} is too big to serialize`;
    }
    item.copy(this.buffer, this.offset);
    this.offset += length;
}
function addUint8ClampedArray(item) {
    const { length } = item;
    if (item.length < 0x100) {
        this.writeUInt8(SIA_TYPES.uint8clampedarray8);
        this.writeUInt8(length);
    } else if (item.length < 0x10000) {
        this.writeUInt8(SIA_TYPES.uint8clampedarray16);
        this.writeUInt16(length);
    } else if (item.length < 0x100000000) {
        this.writeUInt8(SIA_TYPES.uint8clampedarray32);
        this.writeUInt32(length);
    } else {
        throw `Buffer of size ${length} is too big to serialize`;
    }
    item.copy(this.buffer, this.offset);
    this.offset += length;
}
function addInt16Array(item) {
    const { length } = item;
    if (item.length < 0x100) {
        this.writeUInt8(SIA_TYPES.int16array8);
        this.writeUInt8(length);
    } else if (item.length < 0x10000) {
        this.writeUInt8(SIA_TYPES.int16array16);
        this.writeUInt16(length);
    } else if (item.length < 0x100000000) {
        this.writeUInt8(SIA_TYPES.int16array32);
        this.writeUInt32(length);
    } else {
        throw `Buffer of size ${length} is too big to serialize`;
    }
    item.copy(this.buffer, this.offset);
    this.offset += length * 2;
}
function addUint16Array(item) {
    const { length } = item;
    if (item.length < 0x100) {
        this.writeUInt8(SIA_TYPES.uint16array8);
        this.writeUInt8(length);
    } else if (item.length < 0x10000) {
        this.writeUInt8(SIA_TYPES.uint16array16);
        this.writeUInt16(length);
    } else if (item.length < 0x100000000) {
        this.writeUInt8(SIA_TYPES.uint16array32);
        this.writeUInt32(length);
    } else {
        throw `Buffer of size ${length} is too big to serialize`;
    }
    item.copy(this.buffer, this.offset);
    this.offset += length * 2;
}
function addInt32Array(item) {
    const { length } = item;
    if (item.length < 0x100) {
        this.writeUInt8(SIA_TYPES.int32array8);
        this.writeUInt8(length);
    } else if (item.length < 0x10000) {
        this.writeUInt8(SIA_TYPES.int32array16);
        this.writeUInt16(length);
    } else if (item.length < 0x100000000) {
        this.writeUInt8(SIA_TYPES.int32array32);
        this.writeUInt32(length);
    } else {
        throw `Buffer of size ${length} is too big to serialize`;
    }
    item.copy(this.buffer, this.offset);
    this.offset += length * 4;
}
function addUint32Array(item) {
    const { length } = item;
    if (item.length < 0x100) {
        this.writeUInt8(SIA_TYPES.uint32array8);
        this.writeUInt8(length);
    } else if (item.length < 0x10000) {
        this.writeUInt8(SIA_TYPES.uint32array16);
        this.writeUInt16(length);
    } else if (item.length < 0x100000000) {
        this.writeUInt8(SIA_TYPES.uint32array32);
        this.writeUInt32(length);
    } else {
        throw `Buffer of size ${length} is too big to serialize`;
    }
    item.copy(this.buffer, this.offset);
    this.offset += length * 4;
}
function addFloat32Array(item) {
    const { length } = item;
    if (item.length < 0x100) {
        this.writeUInt8(SIA_TYPES.float32array8);
        this.writeUInt8(length);
    } else if (item.length < 0x10000) {
        this.writeUInt8(SIA_TYPES.float32array16);
        this.writeUInt16(length);
    } else if (item.length < 0x100000000) {
        this.writeUInt8(SIA_TYPES.float32array32);
        this.writeUInt32(length);
    } else {
        throw `Buffer of size ${length} is too big to serialize`;
    }
    item.copy(this.buffer, this.offset);
    this.offset += length * 4;
}
function addFloat64Array(item) {
    const { length } = item;
    if (item.length < 0x100) {
        this.writeUInt8(SIA_TYPES.float64array8);
        this.writeUInt8(length);
    } else if (item.length < 0x10000) {
        this.writeUInt8(SIA_TYPES.float64array16);
        this.writeUInt16(length);
    } else if (item.length < 0x100000000) {
        this.writeUInt8(SIA_TYPES.float64array32);
        this.writeUInt32(length);
    } else {
        throw `Buffer of size ${length} is too big to serialize`;
    }
    item.copy(this.buffer, this.offset);
    this.offset += length * 8;
}
function addBigInt64Array(item) {
    const { length } = item;
    if (item.length < 0x100) {
        this.writeUInt8(SIA_TYPES.bigint64array8);
        this.writeUInt8(length);
    } else if (item.length < 0x10000) {
        this.writeUInt8(SIA_TYPES.bigint64array16);
        this.writeUInt16(length);
    } else if (item.length < 0x100000000) {
        this.writeUInt8(SIA_TYPES.bigint64array32);
        this.writeUInt32(length);
    } else {
        throw `Buffer of size ${length} is too big to serialize`;
    }
    item.copy(this.buffer, this.offset);
    this.offset += length * 8;
}
function addBigUint64Array(item) {
    const { length } = item;
    if (item.length < 0x100) {
        this.writeUInt8(SIA_TYPES.biguint64array8);
        this.writeUInt8(length);
    } else if (item.length < 0x10000) {
        this.writeUInt8(SIA_TYPES.biguint64array16);
        this.writeUInt16(length);
    } else if (item.length < 0x100000000) {
        this.writeUInt8(SIA_TYPES.biguint64array32);
        this.writeUInt32(length);
    } else {
        throw `Buffer of size ${length} is too big to serialize`;
    }
    item.copy(this.buffer, this.offset);
    this.offset += length * 8;
}
export {
    addOString,
    addString,
    addRef,
    addORef,
    addNumber,
    addBigInt,
    addInteger,
    addFloat,
    addONumber,
    addRegExp,
    addDate,
    startArray,
    startObject,
    endObject,
    startMap,
    endMap,
    startSet,
    endSet,
    addBoolean,
    addOBoolean,
    addNull,
    addONull,
    addUndefined,
    addCustomType,
    addBuffer,
    addArrayBuffer,
    addInt8Array,
    addUint8Array,
    addUint8ClampedArray,
    addInt16Array,
    addUint16Array,
    addInt32Array,
    addUint32Array,
    addFloat32Array,
    addFloat64Array,
    addBigInt64Array,
    addBigUint64Array
}