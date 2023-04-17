import builtinConstructors from "../constructors.js";
import SIA_TYPES from "../types.js";
import utfz from "@valentech/utfz-lib" // 309ms     │ 341ms    

const BufferClass = typeof Buffer === "undefined" ? BufferShim : Buffer;

const encodedFlagsLookup = [
    '', 'g', 'i', 'gi', 'm', 'gm', 'im', 'gim', 'u', 'gu', 'iu', 'giu', 'mu', 'gmu', 'imu', 'gimu',
    'y', 'gy', 'iy', 'giy', 'my', 'gmy', 'imy', 'gimy', 'uy', 'guy', 'iuy', 'giuy', 'muy', 'gmuy', 'imuy', 'gimuy'
];
const big_64 = 64n;
const bigIndices = new Array(2 ** 8).fill(0).map((_, i) => BigInt(i));

class DeSia {
    constructor({
        constructors = builtinConstructors,
        mapSize = 256 * 1000, // can overflow, if there are too many refs
    } = {}) {
        this.constructors = new Array(256);
        for (const item of constructors) {
            this.constructors[item.code] = item;
        }
        this.map = new Array(mapSize);
        this.offset = 0;
        this.strings = 0;
        this.objects = 0;
        this.objectTracker = new Array(mapSize);
    }
    reset() {
        this.offset = 0;
        this.strings = 0;
        this.objects = 0;
    }
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

            case SIA_TYPES.utfz: {
                const length = this.readUInt8();
                const str = utfz.unpack(this.buffer, length, this.offset);
                this.offset += length;
                this.map[this.strings++] = str;
                return str;
            }

            case SIA_TYPES.string8: {
                const length = this.readUInt8();
                const str = this.readString(length);
                this.map[this.strings++] = str;
                return str;
            }

            case SIA_TYPES.string16: {
                const length = this.readUInt16();
                const str = this.readString(length);
                this.map[this.strings++] = str;
                return str;
            }

            case SIA_TYPES.string32: {
                const length = this.readUInt32();
                const str = this.readString(length);
                this.map[this.strings++] = str;
                return str;
            }

            default:
                throw `Key of type ${blockType} is invalid.`;
        }
    }
    readBlock() {
        const blockType = this.readUInt8();
        // console.log({ blockType })
        switch (blockType) {
            case SIA_TYPES.utfz: {
                const length = this.readUInt8();
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

            case SIA_TYPES.bin8: {
                const length = this.readUInt8();
                const buf = BufferClass.allocUnsafeSlow(length);
                this.buffer.copy(buf, 0, this.offset, this.offset + length);
                this.offset += length;
                return buf;
            }

            case SIA_TYPES.bin16: {
                const length = this.readUInt16();
                const buf = BufferClass.allocUnsafeSlow(length);
                this.buffer.copy(buf, 0, this.offset, this.offset + length);
                this.offset += length;
                return buf;
            }

            case SIA_TYPES.bin32: {
                const length = this.readUInt32();
                const buf = BufferClass.allocUnsafeSlow(length);
                this.buffer.copy(buf, 0, this.offset, this.offset + length);
                this.offset += length;
                return buf;
            }

            case SIA_TYPES.int8: {
                return this.readInt8();
            }

            case SIA_TYPES.int16: {
                return this.readInt16();
            }

            case SIA_TYPES.int32: {
                return this.readInt32();
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

            case SIA_TYPES.float64: {
                return this.readDouble();
            }

            case SIA_TYPES.constructor8: {
                const code = this.readUInt8();
                const args = this.readBlock();
                const constructor = this.constructors[code];
                if (constructor) {
                    return constructor.build(...args);
                } else {
                    throw `Constructor ${code} is unknown`;
                }
            }

            case SIA_TYPES.constructor16: {
                const code = this.readUInt16();
                const args = this.readBlock();
                const constructor = this.constructors[code];
                if (constructor) {
                    return constructor.build(...args);
                } else {
                    throw `Constructor ${code} is unknown`;
                }
            }

            case SIA_TYPES.constructor32: {
                const code = this.readUInt32();
                const args = this.readBlock();
                const constructor = this.constructors[code];
                if (constructor) {
                    return constructor.build(...args);
                } else {
                    throw `Constructor ${code} is unknown`;
                }
            }

            case SIA_TYPES.false:
                return false;

            case SIA_TYPES.true:
                return true;

            case SIA_TYPES.null:
                return null;

            case SIA_TYPES.undefined:
                return undefined;

            case SIA_TYPES.objectStart: {
                const obj = {};
                this.objectTracker[this.objects++] = obj;
                let curr = this.buffer[this.offset++];
                while (curr !== SIA_TYPES.objectEnd) {
                    obj[this.readKey(curr)] = this.readBlock();
                    curr = this.buffer[this.offset++];
                }
                return obj;
            }

            case SIA_TYPES.mapStart: {
                const map = new Map();
                this.objectTracker[this.objects++] = map;
                let curr = this.buffer[this.offset];
                while (curr !== SIA_TYPES.mapEnd) {
                    let key = this.readBlock();
                    let value = this.readBlock();
                    map.set(key, value);
                    curr = this.buffer[this.offset];

                }
                this.offset++;
                return map;

            }

            case SIA_TYPES.setStart: {
                const set = new Set();
                this.objectTracker[this.objects++] = set;
                let curr = this.buffer[this.offset];
                while (curr !== SIA_TYPES.setEnd) {
                    set.add(this.readBlock());
                    curr = this.buffer[this.offset];
                }
                this.offset++;
                return set;

            }

            case SIA_TYPES.array8: {
                const length = this.readUInt8();
                const arr = new Array(length);
                this.objectTracker[this.objects++] = arr;
                for (let i = 0; i < length; i++) {
                    arr[i] = this.readBlock();
                }
                return arr;
            }

            case SIA_TYPES.array16: {
                const length = this.readUInt16();
                const arr = new Array(length);
                this.objectTracker[this.objects++] = arr;
                for (let i = 0; i < length; i++) {
                    arr[i] = this.readBlock();
                }
                return arr;
            }

            case SIA_TYPES.array32: {
                const length = this.readUInt32();
                const arr = new Array(length);
                this.objectTracker[this.objects++] = arr;
                for (let i = 0; i < length; i++) {
                    arr[i] = this.readBlock();
                }
                return arr;
            }
            case SIA_TYPES.bigint8: {
                return BigInt(this.readInt8())
            }
            case SIA_TYPES.bigint16: {
                return BigInt(this.readInt16())
            }
            case SIA_TYPES.bigint32: {
                return BigInt(this.readInt32())
            }
            case SIA_TYPES.bigint64: {
                return BigInt(this.readBigInt64())
            }
            case SIA_TYPES.bigintN: {
                const chunksCount = this.readUInt8();
                let bigIntValue = 0n;
                for (let i = 0; i < chunksCount; i++) {
                    const bytesRead = this.buffer.readBigUInt64LE(this.offset);
                    bigIntValue += bytesRead << (big_64 * bigIndices[i]);
                    this.offset += 8;
                }
                return -bigIntValue;
            }
            case SIA_TYPES.biguint8: {
                return BigInt(this.readUInt8())
            }
            case SIA_TYPES.biguint16: {
                return BigInt(this.readUInt16())
            }
            case SIA_TYPES.biguint32: {
                return BigInt(this.readUInt32())
            }
            case SIA_TYPES.biguint64: {
                return this.readBigUInt64()
            }
            case SIA_TYPES.biguintN: {
                const chunksCount = this.readUInt8();
                let bigIntValue = 0n;
                for (let i = 0; i < chunksCount; i++) {
                    const bytesRead = this.buffer.readBigUInt64LE(this.offset);
                    bigIntValue += bytesRead << (big_64 * bigIndices[i]); // (64n * BigInt(i)) //(2n ** (64n * BigInt(i)));
                    this.offset += 8;
                }
                return bigIntValue;
            }

            // For Int8Array
            case SIA_TYPES.int8array8: {
                const length = this.readUInt8();
                const offset = this.offset;
                this.offset += length;
                return new Int8Array(length).set(Int8Array.from(this.buffer.slice(offset, length)));
            }

            case SIA_TYPES.int8array16: {
                const length = this.readUInt16();
                const offset = this.offset;
                this.offset += length;
                return new Int8Array(length).set(Int8Array.from(this.buffer.slice(offset, length)));
            }

            case SIA_TYPES.int8array32: {
                const length = this.readUInt32();
                const offset = this.offset;
                this.offset += length;
                return new Int8Array(length).set(Int8Array.from(this.buffer.slice(offset, length)));
            }
            // For Uint8Array
            case SIA_TYPES.uint8array8: {
                const length = this.readUInt8();
                const offset = this.offset;
                this.offset += length;
                return new Uint8Array(length).set(Uint8Array.from(this.buffer.slice(offset, length)));
            }

            case SIA_TYPES.uint8array16: {
                const length = this.readUInt16();
                const offset = this.offset;
                this.offset += length;
                return new Uint8Array(length).set(Uint8Array.from(this.buffer.slice(offset, length)));
            }

            case SIA_TYPES.uint8array32: {
                const length = this.readUInt32();
                const offset = this.offset;
                this.offset += length;
                return new Uint8Array(length).set(Uint8Array.from(this.buffer.slice(offset, length)));
            }

            // For Uint8ClampedArray
            case SIA_TYPES.uint8clampedarray8: {
                const length = this.readUInt8();
                const offset = this.offset;
                this.offset += length;
                return new Uint8ClampedArray(length).set(Uint8ClampedArray.from(this.buffer.slice(offset, length)));
            }

            case SIA_TYPES.uint8clampedarray16: {
                const length = this.readUInt16();
                const offset = this.offset;
                this.offset += length;
                return new Uint8ClampedArray(length).set(Uint8ClampedArray.from(this.buffer.slice(offset, length)));
            }

            case SIA_TYPES.uint8clampedarray32: {
                const length = this.readUInt32();
                const offset = this.offset;
                this.offset += length;
                return new Uint8ClampedArray(length).set(Uint8ClampedArray.from(this.buffer.slice(offset, length)));
            }

            // For Int16Array
            case SIA_TYPES.int16array8: {
                const length = this.readUInt8();
                const offset = this.offset;
                this.offset += length * 2;
                return new Int16Array(length).set(Int16Array.from(this.buffer.slice(offset, length)));
            }

            case SIA_TYPES.int16array16: {
                const length = this.readUInt16();
                const offset = this.offset;
                this.offset += length * 2;
                return new Int16Array(length).set(Int16Array.from(this.buffer.slice(offset, length)));
            }

            case SIA_TYPES.int16array32: {
                const length = this.readUInt32();
                const offset = this.offset;
                this.offset += length * 2;
                return new Int16Array(length).set(Int16Array.from(this.buffer.slice(offset, length)));
            }

            // For Uint16Array
            case SIA_TYPES.uint16array8: {
                const length = this.readUInt8();
                const offset = this.offset;
                this.offset += length * 2;
                return new Uint16Array(length).set(Uint16Array.from(this.buffer.slice(offset, length)));
            }

            case SIA_TYPES.uint16array16: {
                const length = this.readUInt16();
                const offset = this.offset;
                this.offset += length * 2;
                return new Uint16Array(length).set(Uint16Array.from(this.buffer.slice(offset, length)));
            }

            case SIA_TYPES.uint16array32: {
                const length = this.readUInt32();
                const offset = this.offset;
                this.offset += length * 2;
                return new Uint16Array(length).set(Uint16Array.from(this.buffer.slice(offset, length)));
            }
            // For Int32Array
            case SIA_TYPES.int32array8: {
                const length = this.readUInt8();
                const offset = this.offset;
                this.offset += length * 4;
                return new Int32Array(length).set(Int32Array.from(this.buffer.slice(offset, length)));
            }

            case SIA_TYPES.int32array16: {
                const length = this.readUInt16();
                const offset = this.offset;
                this.offset += length * 4;
                return new Int32Array(length).set(Int32Array.from(this.buffer.slice(offset, length)));
            }

            case SIA_TYPES.int32array32: {
                const length = this.readUInt32();
                const offset = this.offset;
                this.offset += length * 4;
                return new Int32Array(length).set(Int32Array.from(this.buffer.slice(offset, length)));
            }

            // For Uint32Array
            case SIA_TYPES.uint32array8: {
                const length = this.readUInt8();
                const offset = this.offset;
                this.offset += length * 4;
                return new Uint32Array(length).set(Uint32Array.from(this.buffer.slice(offset, length)));
            }

            case SIA_TYPES.uint32array16: {
                const length = this.readUInt16();
                const offset = this.offset;
                this.offset += length * 4;
                return new Uint32Array(length).set(Uint32Array.from(this.buffer.slice(offset, length)));
            }

            case SIA_TYPES.uint32array32: {
                const length = this.readUInt32();
                const offset = this.offset;
                this.offset += length * 4;
                return new Uint32Array(length).set(Uint32Array.from(this.buffer.slice(offset, length)));
            }

            // For Float32Array
            case SIA_TYPES.float32array8: {
                const length = this.readUInt8();
                const offset = this.offset;
                this.offset += length * 4;
                return new Float32Array(length).set(Float32Array.from(this.buffer.slice(offset, length)));
            }

            case SIA_TYPES.float32array16: {
                const length = this.readUInt16();
                const offset = this.offset;
                this.offset += length * 4;
                return new Float32Array(length).set(Float32Array.from(this.buffer.slice(offset, length)));
            }

            case SIA_TYPES.float32array32: {
                const length = this.readUInt32();
                const offset = this.offset;
                this.offset += length * 4;
                return new Float32Array(length).set(Float32Array.from(this.buffer.slice(offset, length)));
            }

            // For Float64Array
            case SIA_TYPES.float64array8: {
                const length = this.readUInt8();
                const offset = this.offset;
                this.offset += length * 8;
                return new Float64Array(length).set(Float64Array.from(this.buffer.slice(offset, length)));
            }

            case SIA_TYPES.float64array16: {
                const length = this.readUInt16();
                const offset = this.offset;
                this.offset += length * 8;
                return new Float64Array(length).set(Float64Array.from(this.buffer.slice(offset, length)));
            }

            case SIA_TYPES.float64array32: {
                const length = this.readUInt32();
                const offset = this.offset;
                this.offset += length * 8;
                return new Float64Array(length).set(Float64Array.from(this.buffer.slice(offset, length)));
            }

            // For BigInt64Array
            case SIA_TYPES.bigint64array8: {
                const length = this.readUInt8();
                const offset = this.offset;
                this.offset += length * 8;
                return new BigInt64Array(length).set(BigInt64Array.from(this.buffer.slice(offset, length)));
            }

            case SIA_TYPES.bigint64array16: {
                const length = this.readUInt16();
                const offset = this.offset;
                this.offset += length * 8;
                return new BigInt64Array(length).set(BigInt64Array.from(this.buffer.slice(offset, length)));
            }

            case SIA_TYPES.bigint64array32: {
                const length = this.readUInt32();
                const offset = this.offset;
                this.offset += length * 8;
                return new BigInt64Array(length).set(BigInt64Array.from(this.buffer.slice(offset, length)));
            }

            // For BigUint64Array
            case SIA_TYPES.biguint64array8: {
                const length = this.readUInt8();
                const offset = this.offset;
                this.offset += length * 8;
                return new BigUint64Array(length).set(BigUint64Array.from(this.buffer.slice(offset, length)));
            }

            case SIA_TYPES.biguint64array16: {
                const length = this.readUInt16();
                const offset = this.offset;
                this.offset += length * 8;
                return new BigUint64Array(length).set(BigUint64Array.from(this.buffer.slice(offset, length)));
            }

            case SIA_TYPES.biguint64array32: {
                const length = this.readUInt32();
                const offset = this.offset;
                this.offset += length * 8;
                return new BigUint64Array(length).set(BigUint64Array.from(this.buffer.slice(offset, length)));
            }
            case SIA_TYPES.date: {
                return new Date(this.readDouble());
            }
            case SIA_TYPES.regexp: {
                const encodedFlags = this.readUInt8();
                const source = this.readBlock();
                const flags = encodedFlagsLookup[encodedFlags];
                return new RegExp(source, flags);
            }
            case SIA_TYPES.oref8: {
                const key = this.readUInt8();
                return this.objectTracker[key];
            }
            case SIA_TYPES.oref16: {
                const key = this.readUInt16();
                return this.objectTracker[key];
            }
            case SIA_TYPES.oref32: {
                const key = this.readUInt32();
                return this.objectTracker[key];
            }
            case SIA_TYPES.onull: {
                return Object.create(null);
            }
            case SIA_TYPES.onumber: {
                return new Number(this.readBlock());
            }
            case SIA_TYPES.ostring: {
                return new String(this.readBlock());
            }
            case SIA_TYPES.otrue: {
                return new Boolean(true);
            }
            case SIA_TYPES.ofalse: {
                return new Boolean(false);
            }
            default:
                // console.log(`Unsupported type: ${blockType}`);
                // console.log(this.offset, this.buffer)
                const error = `Unsupported type: ${blockType}`;
                throw error;
        }
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
    readBigUInt64() {
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
    readBigInt64() {
        const uInt64 = this.buffer.readBigInt64LE(this.offset);
        this.offset += 8;
        return uInt64;
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
    deserialize(buffer) {
        this.buffer = buffer;
        this.reset();
        return this.readBlock();
    }
}
export default DeSia;