import SIA_TYPES from "../types.js";
// import utfz from "@valentech/utfz-lib";
import utfz from "../utfz.js"
function addOString(string) {
    this.writeUInt8(SIA_TYPES.ostring);
    this.addString(string)
}
function addString(string) {
    const strLen = string.length;

    if (strLen < 60) {
        // Short string optimization: pack using utfz.
        // Write type tag.
        this.writeUInt8(SIA_TYPES.utfz);
        // Reserve one byte for the byte length.
        const lenIndex = this.offset;
        this.offset++;

        // Pack the string using utfz; this function writes into the buffer at this.offset
        // and returns the number of bytes written.
        const byteLength = utfz.pack(string, strLen, this.buffer, this.offset);

        // Write the byte length into the reserved slot.
        this.buffer[lenIndex] = byteLength;
        // Advance the offset past the packed string.
        this.offset += byteLength;
        return;
    }

    // For longer strings, calculate worst-case length (UTF-8 can be up to 3 bytes per code unit).
    const maxBytes = strLen * 3;
    const startOffset = this.offset;

    // Instead of using a DataView, write length bytes directly.
    if (maxBytes < 0x100) {
        // 1-byte length
        this.buffer[this.offset++] = SIA_TYPES.string8;
        const lenIndex = this.offset;
        this.offset++; // reserve 1 byte for length
        const byteLength = this.writeString(string, this.offset);
        this.buffer[lenIndex] = byteLength;
        this.offset += byteLength;
    } else if (maxBytes < 0x10000) {
        // 2-byte length, little-endian
        this.buffer[this.offset++] = SIA_TYPES.string16;
        const lenIndex = this.offset;
        this.offset += 2; // reserve 2 bytes for length
        const byteLength = this.writeString(string, this.offset);
        this.buffer[lenIndex] = byteLength & 0xff;
        this.buffer[lenIndex + 1] = (byteLength >> 8) & 0xff;
        this.offset += byteLength;
    } else {
        // 4-byte length, little-endian
        this.buffer[this.offset++] = SIA_TYPES.string32;
        const lenIndex = this.offset;
        this.offset += 4; // reserve 4 bytes for length
        const byteLength = this.writeString(string, this.offset);
        this.buffer[lenIndex] = byteLength & 0xff;
        this.buffer[lenIndex + 1] = (byteLength >> 8) & 0xff;
        this.buffer[lenIndex + 2] = (byteLength >> 16) & 0xff;
        this.buffer[lenIndex + 3] = (byteLength >>> 24) & 0xff;
        this.offset += byteLength;
    }
}


// Helper function (you'll need to implement this)
function ensureCapacity(requiredLength) {
    if (this.buffer.length < requiredLength) {
        const newSize = Math.pow(2, Math.ceil(Math.log2(requiredLength)));
        const newBuffer = new Uint8Array(newSize);
        newBuffer.set(this.buffer);
        this.buffer = newBuffer;
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
    const dv = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.length);

    if (number < big_zero) {
        // Negative number handling
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
        }
    } else {
        // Positive number handling
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

    // Handle extended precision bigints
    let length = 0;
    const startOffset = this.offset + 1; // Reserve space for length byte

    // Write 64-bit chunks
    while (number > big_zero) {
        const chunk = BigInt.asUintN(64, number);
        this.writeBigUInt64AtOffset(chunk, startOffset + 8 * length);
        number = number >> big_64;
        length++;
    }

    // Write length byte and update offset
    dv.setUint8(this.offset, length);
    this.offset = startOffset + 8 * length;
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
// function addBuffer(item) {
//     const { length } = item;
//     if (item.length < 0x100) {
//         this.writeUInt8(SIA_TYPES.bin8);
//         this.writeUInt8(length);
//         item.copy(this.buffer, this.offset);
//         this.offset += length;
//     } else if (item.length < 0x10000) {
//         this.writeUInt8(SIA_TYPES.bin16);
//         this.writeUInt16(length);
//         item.copy(this.buffer, this.offset);
//         this.offset += length;
//     } else if (item.length < 0x100000000) {
//         this.writeUInt8(SIA_TYPES.bin32);
//         this.writeUInt32(length);
//         item.copy(this.buffer, this.offset);
//         this.offset += length;
//     } else {
//         throw `Buffer of size ${length} is too big to serialize`;
//     }
// }
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
function copyTypedArrayToBuffer(item) {
    const byteView = new Uint8Array(item.buffer, item.byteOffset, item.byteLength);
    this.buffer.set(byteView, this.offset);
    this.offset += item.byteLength;
}
function addInt8Array(item) {
    const { length } = item;
    if (length < 0x100) {
        this.writeUInt8(SIA_TYPES.int8array8);
        this.writeUInt8(length);
    } else if (length < 0x10000) {
        this.writeUInt8(SIA_TYPES.int8array16);
        this.writeUInt16(length);
    } else if (length < 0x100000000) {
        this.writeUInt8(SIA_TYPES.int8array32);
        this.writeUInt32(length);
    } else {
        throw new Error(`Buffer of size ${length} is too big to serialize`);
    }
    // Create a byte view to get the raw bytes.
    this.copyTypedArrayToBuffer(item); // For Int8Array, byteLength === length.
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
    this.copyTypedArrayToBuffer(item);
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
    this.copyTypedArrayToBuffer(item);
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
    this.copyTypedArrayToBuffer(item);
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
    this.copyTypedArrayToBuffer(item);
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
    this.copyTypedArrayToBuffer(item);
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
    this.copyTypedArrayToBuffer(item);
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
    this.copyTypedArrayToBuffer(item);
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
    this.copyTypedArrayToBuffer(item);
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
    this.copyTypedArrayToBuffer(item);
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
    this.copyTypedArrayToBuffer(item);
}
export {
    ensureCapacity,
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
    // addBuffer,
    addArrayBuffer,
    copyTypedArrayToBuffer,
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