import builtinConstructors from "./constructors.js";
import SIA_TYPES from "./types.js";
// faster compression speed than the original utfz-lib; optimizations copied from utf-zap
import utfz from "@valentech/utfz-lib";
import { Buffer as BufferShim } from "buffer/index.js";
const BufferClass = typeof Buffer === "undefined" ? BufferShim : Buffer;

{
    const size = 33554432;
    const buffer = BufferClass.alloc(size); // new ArrayBuffer(size, {});//
    let offset = 0;
    const string = `Code is written in ASM.JS style so number are fixed to be stored based on entire number encoding, always, and number comparaison too, so we give more strict instructions for the browser to have less hesitations.`;
    let packed = utfz.pack(string, string.length, buffer, offset);
    let unpacked = utfz.unpack(buffer, packed, offset)
}
const bufferSize = 0x2000000; // 32Mb
class Sia {
    constructor({ size = bufferSize, constructors = [] } = {}) {
        this.map = new Map();
        // this is safe in our case, since we write stuff in the buffer sequentially and slice that sequence
        // therefore there is no way that the contents of the allocated region are returned.
        // TLDR; We write sequentially into the buffer region that is returned as a slice 
        this.buffer = BufferClass.allocUnsafe(size); // new ArrayBuffer(size, { maxByteLength: 0x40000000 }) // 1Gb //BufferClass.allocUnsafe(size);
        this.offset = 0;
        this.constructors = constructors;
        this.strings = 0;
    }
    reset() {
        this.offset = 0;
        this.strings = 0;
        this.map = new Map();
    }
    // these are wrapper methods for native buffer methods
    writeString(str, offset) {
        return this.buffer.write(str, offset);
    }
    writeUInt8(number) {
        this.buffer[this.offset] = number;
        this.offset += 1;
    }
    writeUInt16(number) {
        // this.buffer.writeUInt16LE(number, this.offset);
        // this is a tiny bit more faster than the native method
        this.buffer[this.offset] = number & 0xff;
        this.buffer[this.offset + 1] = number >> 8;
        this.offset += 2;
    }
    writeUInt32(number) {
        this.buffer.writeUInt32LE(number, this.offset);
        this.offset += 4;
    }
    writeUint64(number) {
        this.buffer.writeBigUint64LE(number, this.offset);
        this.offset += 8;
    }
    writeInt8(number) {
        this.buffer.writeInt8(number, this.offset);
        this.offset += 1;
    }
    writeInt16(number) {
        this.buffer.writeInt16LE(number, this.offset);
        this.offset += 2;
    }
    writeInt32(number) {
        this.buffer.writeInt32LE(number, this.offset);
        this.offset += 4;
    }
    writeInt64(number) {
        this.buffer.writeBigInt64LE(number, this.offset);
        this.offset += 8;
    }
    // writeFloatLE is omitted because there are only 64 bit doubles in javascript
    writeDouble(number) {
        this.buffer.writeDoubleLE(number, this.offset);
        this.offset += 8;
    }
    startObject() {
        this.writeUInt8(SIA_TYPES.objectStart);
    }
    endObject() {
        this.writeUInt8(SIA_TYPES.objectEnd);
    }
    startArray(length) {
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
    // these methods descrype how a js type is to be serialized
    // addString(string) { // todo
    //     const { length } = string;
    //     const maxBytes = length * 3;
    //     if (maxBytes < 0x100) {
    //         //if (length < 128) {
    //         this.writeUInt8(SIA_TYPES.utfz8);
    //         // const byteLength = this.writeString(string, this.offset + 1);
    //         const byteLength = utfz.pack(
    //             string,
    //             length,
    //             this.buffer,
    //             this.offset + 1
    //         );
    //         this.buffer.writeUInt8(byteLength, this.offset);
    //         this.offset += byteLength + 1;
    //         //} else {
    //         //  this.writeUInt8(SIA_TYPES.string8);
    //         //  const byteLength = this.writeString(string, this.offset + 1);
    //         //  this.buffer.writeUInt8(byteLength, this.offset);
    //         //  this.offset += byteLength + 1;
    //         //}
    //     } else if (maxBytes < 0x10000) {
    //         this.writeUInt8(SIA_TYPES.utfz16);
    //         const byteLength = utfz.pack(
    //             string,
    //             length,
    //             this.buffer,
    //             this.offset + 2
    //         );
    //         this.buffer.writeUInt16LE(byteLength, this.offset);
    //         this.offset += byteLength + 2;
    //     } else {
    //         this.writeUInt8(SIA_TYPES.utfz32);
    //         const byteLength = utfz.pack(
    //             string,
    //             length,
    //             this.buffer,
    //             this.offset + 4
    //         );
    //         this.buffer.writeUInt32LE(byteLength, this.offset);
    //         this.offset += byteLength + 4;
    //     }
    // }
    addString(string) {
        const { length } = string;
        // See benchmarks/string/both
        if (length < 60) {
            this.writeUInt8(SIA_TYPES.utfz8);
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
            //if (length < 128) {
            this.writeUInt8(SIA_TYPES.string8);
            const byteLength = this.writeString(string, this.offset + 1);
            this.buffer.writeUInt8(byteLength, this.offset);
            this.offset += byteLength + 1;
            //} else {
            //  this.writeUInt8(SIA_TYPES.string8);
            //  const byteLength = this.writeString(string, this.offset + 1);
            //  this.buffer.writeUInt8(byteLength, this.offset);
            //  this.offset += byteLength + 1;
            //}
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
    addRef(ref) {
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
    addNull() {
        this.writeUInt8(SIA_TYPES.null);
    }
    addUndefined() {
        this.writeUInt8(SIA_TYPES.undefined);
    }
    addBoolean(bool) {
        const type = bool ? SIA_TYPES.true : SIA_TYPES.false;
        this.writeUInt8(type);
    }
    addNumber(number) {
        // TODO: make this faster https://jsben.ch/26igA
        if (Number.isInteger(number)) return this.addInteger(number);
        return this.addFloat(number);
    }

    addInteger(number) {
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
    addFloat(number) {
        this.writeUInt8(SIA_TYPES.float64);
        this.writeDouble(number);
    }
    // serialize an item, decide which serialization method is to be picked
    serializeItem(item) {
        const type = typeof item;
        switch (type) {
            case "string":
                this.addString(item);
                return;

            case "undefined":
                this.addUndefined(item);
                return;

            case "number":
                this.addNumber(item);
                return;

            case "boolean":
                this.addBoolean(item);
                return;
            case "bigint":
                this.addBigInt(item);
                return;
            case "object": {
                if (item === null) {
                    this.addNull(item);
                    return;
                }
                const { constructor } = Object.getPrototypeOf(item);
                switch (constructor) {
                    case Array: {
                        this.startArray(item.length);
                        for (let i = 0; i < item.length; i++) {
                            this.serializeItem(item[i]);
                        }
                        return;
                    }
                    case Object: {
                        this.startObject();
                        let keys = Object.keys(item);
                        for (let i = 0; i < keys.length; i++) {
                            let key = keys[i];
                            // write key or a reference to key
                            const ref = this.map.get(key);
                            if (!ref) {
                                this.map.set(key, this.strings++);
                                this.addString(key);
                            } else {
                                this.addRef(ref);
                            }
                            // write value 
                            this.serializeItem(item[key]);
                        }
                        this.endObject();
                        return;
                    }
                }
            }

            case "symbol":
            case "function":
                throw `Unsupported type. ${type} cannot be serialized.`;
        }
    }
    serialize(data) {
        this.data = data;
        this.reset();
        this.serializeItem(this.data);
        return this.buffer.slice(0, this.offset);
    }
}

class DeSia {
    constructor({
        constructors = builtinConstructors,
        mapSize = 256 * 1024,
    } = {}) {
        this.constructors = new Array(256);
        for (const item of constructors) {
            this.constructors[item.code] = item;
        }
        this.map = new Array(mapSize);
        this.offset = 0;
        this.strings = 0;
    }
    reset() {
        this.offset = 0;
        this.strings = 0;
    }
    readUInt8() {
        return this.buffer[this.offset++];
    }
    readUInt16() {
        return this.buffer[this.offset++] + (this.buffer[this.offset++] << 8);
    }
    readUInt32() {
        const uInt32 = this.buffer.readUInt32LE(this.offset);
        this.offset += 4;
        return uInt32;
    }
    readUInt64() {
        const uInt64 = this.buffer.readBigUInt64LE(this.offset);
        this.offset += 8;
        return uInt64;
    }
    readInt8() {
        return this.buffer.readInt8(this.offset++);
    }
    readInt16() {
        const int16 = this.buffer.readInt16LE(this.offset);
        this.offset += 2;
        return int16;
    }
    readInt32() {
        const int32 = this.buffer.readInt32LE(this.offset);
        this.offset += 4;
        return int32;
    }
    readInt64() {
        const int64 = this.buffer.readBigInt64LE(this.offset);
        this.offset += 8;
        return int64;
    }
    readDouble() {
        const uInt64 = this.buffer.readDoubleLE(this.offset);
        this.offset += 8;
        return uInt64;
    }
    readString(length) {
        const str = this.buffer.toString("utf8", this.offset, this.offset + length);
        this.offset += length;
        return str;
    }
    //
    readKey(blockType) {
        switch (blockType) {
            case SIA_TYPES.ref8: {
                const ref = this.readUInt8();
                return this.map[ref];
            }

            case SIA_TYPES.ref16: {
                const ref = this.readUInt16();
                return this.map[ref];
            }

            case SIA_TYPES.ref32: {
                const ref = this.readUInt32();
                return this.map[ref];
            }

            case SIA_TYPES.utfz8: {
                const length = this.readUInt8();
                const str = utfz.unpack(this.buffer, length, this.offset);
                this.offset += length;
                this.map[this.strings++] = str;
                return str;
            }
            case SIA_TYPES.utfz16: {
                const length = this.readUInt16();
                const str = utfz.unpack(this.buffer, length, this.offset);
                this.offset += length;
                this.map[this.strings++] = str;
                return str;
            }
            case SIA_TYPES.utfz32: {
                const length = this.readInt32();
                const str = utfz.unpack(this.buffer, length, this.offset);
                this.offset += length;
                this.map[this.strings++] = str;
                return str;
            }

            case SIA_TYPES.string8: {
                const length = this.readUInt8();
                const str = this.readString(length);
                return str;
            }

            case SIA_TYPES.string16: {
                const length = this.readUInt16();
                const str = this.readString(length);
                return str;
            }

            case SIA_TYPES.string32: {
                const length = this.readUInt32();
                const str = this.readString(length);
                return str;
            }

            default:
                throw `Key of type ${blockType} is invalid.`;
        }
    }
    readBlock(topLevel = false) {
        // block types are encoded via uInt8, which limits the possible number of types to 256
        const blockType = this.readUInt8();
        switch (blockType) {
            case SIA_TYPES.utfz8: {
                const length = this.readUInt8();
                const str = utfz.unpack(this.buffer, length, this.offset);
                this.offset += length;
                return str;
            }
            case SIA_TYPES.utfz16: {
                const length = this.readUInt16();
                const str = utfz.unpack(this.buffer, length, this.offset);
                this.offset += length;
                return str;
            }
            case SIA_TYPES.utfz32: {
                const length = this.readInt32();
                const str = utfz.unpack(this.buffer, length, this.offset);
                this.offset += length;
                return str;
            }
            case SIA_TYPES.string8: {
                const length = this.readUInt8();
                const str = this.readString(length);
                return str;
            }

            case SIA_TYPES.string16: {
                const length = this.readUInt16();
                const str = this.readString(length);
                return str;
            }

            case SIA_TYPES.string32: {
                const length = this.readUInt32();
                const str = this.readString(length);
                return str;
            }

            // types containing no information
            case SIA_TYPES.false:
                return false;

            case SIA_TYPES.true:
                return true;

            case SIA_TYPES.null:
                return null;

            case SIA_TYPES.undefined:
                return undefined;

            case SIA_TYPES.int8: {
                return this.readInt8();
            }

            case SIA_TYPES.int16: {
                return this.readInt16();
            }

            case SIA_TYPES.int32: {
                return this.readInt32();
            }
            case SIA_TYPES.int64: {
                return this.readInt64();
            }
            case SIA_TYPES.uint8: {
                return this.readUInt8();
            }
            case SIA_TYPES.uint16: {
                return this.readUInt16();
            }
            case SIA_TYPES.uint32: {
                return this.readUInt32();
            }
            case SIA_TYPES.uInt64: {
                return this.readUInt64();
            }
            case SIA_TYPES.float64: {
                return this.readDouble();
            }
            case SIA_TYPES.array8: {
                const length = this.readUInt8();
                const arr = new Array(length);
                for (let i = 0; i < length; i++) {
                    arr[i] = this.readBlock();
                }
                return arr;
            }

            case SIA_TYPES.array16: {
                const length = this.readUInt16();
                const arr = new Array(length);
                for (let i = 0; i < length; i++) {
                    arr[i] = this.readBlock();
                }
                return arr;
            }

            case SIA_TYPES.array32: {
                const length = this.readUInt32();
                const arr = new Array(length);
                for (let i = 0; i < length; i++) {
                    arr[i] = this.readBlock();
                }
                return arr;
            }
            case SIA_TYPES.objectStart: {
                const obj = {};
                let curr = this.buffer[this.offset++];
                while (curr !== SIA_TYPES.objectEnd) {
                    obj[this.readKey(curr)] = this.readBlock();
                    curr = this.buffer[this.offset++];
                }
                return obj;
            }
            default:
                const error = `Unsupported type: ${blockType}`;
                throw error;
        }
    }
    deserialize(buffer) {
        this.buffer = buffer;
        this.reset();
        return this.readBlock(true);
    }
}

const _Sia = new Sia();
const _Desia = new DeSia();

const sia = (data) => _Sia.serialize(data);
const desia = (data) => _Desia.deserialize(data);

export default { sia, desia, Sia, DeSia, builtinConstructors }

// var obj = {
//     address: {
//         city: 'Gwenborough',
//         geo: {
//             lat: '-37.3159',
//             lng: '81.1496'
//         },
//         street: 'Kulas Light',
//         suite: 'Apt. 556',
//         zipcode: '92998-3874'
//     },
//     company: {
//         bs: 'harness real-time e-markets',
//         catchPhrase: 'Multi-layered client-server neural-net',
//         name: 'Romaguera-Crona'
//     },
//     email: 'Sincere@april.biz',
//     id: 1,
//     name: 'Leanne Graham',
//     phone: '1-770-736-8031 x56442',
//     username: 'Bret',
//     website: 'hildegard.org'
// }
//console.log(desia(sia([1])))

// import deepEqual from "deep-equal";
// let testTypes = [
//     2 ** 0,
//     2 ** 8,
//     2 ** 16,
//     2 ** 32,
//     2 ** 48,
//     2 ** 64,
//     Number.MAX_SAFE_INTEGER,
//     Number.MIN_SAFE_INTEGER,
//     Number.NEGATIVE_INFINITY,
//     Number.POSITIVE_INFINITY,
//     NaN,
//     Number.EPSILON,
//     12342551514.5451234,
//     'a'
// ]
// console.log(sia('a'))
// for (let testType of testTypes) {
//     let output = desia(sia(testType));
//     console.log(testType, output)
//     if (!deepEqual(testType, output)) if (typeof testType !== 'number' && !isNaN(test)) console.error(testType)
// }

// var buf = Buffer.alloc(8);
// buf.writeFloatLE(44.88);
// console.log(buf.readFloatLE())
// var dv = new DataView(buf.buffer, 4);

// console.log(dv.getFloat32())


// console.log(1)
