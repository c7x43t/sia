import builtinConstructors from "../constructors.js";
import SIA_TYPES from "../types.js";
// import utfz from "@valentech/utfz-lib" // 309ms     │ 341ms    
import utfz from "../utfz.js"
const BufferClass = Buffer; // typeof Buffer === "undefined" ? BufferShim : Buffer;

const encodedFlagsLookup = [
    '', 'g', 'i', 'gi', 'm', 'gm', 'im', 'gim', 'u', 'gu', 'iu', 'giu', 'mu', 'gmu', 'imu', 'gimu',
    'y', 'gy', 'iy', 'giy', 'my', 'gmy', 'imy', 'gimy', 'uy', 'guy', 'iuy', 'giuy', 'muy', 'gmuy', 'imuy', 'gimuy'
];
const big_64 = 64n;
const bigIndices = new Array(2 ** 8).fill(0).map((_, i) => BigInt(i));
const textDecoder = new TextDecoder('utf-8');
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
        this.textDecoder = textDecoder;
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
        const blockType = this.buffer[this.offset++]; //this.readUInt8();
        // console.log({ blockType })
        switch (blockType) {
            case SIA_TYPES.utfz: {
                const length = this.readUInt8();
                const str = utfz.unpack(this.buffer, length, this.offset);
                this.offset += length;
                return str;
            }

            case SIA_TYPES.string8: {
                const len = this.buffer[this.offset++];
                const str = this.textDecoder.decode(this.buffer.subarray(this.offset, this.offset + len));
                this.offset += len;
                return str;
            }
            case SIA_TYPES.string16: {
                // Little-endian 16-bit length
                const len = this.buffer[this.offset] | (this.buffer[this.offset + 1] << 8);
                this.offset += 2;
                const str = this.textDecoder.decode(this.buffer.subarray(this.offset, this.offset + len));
                this.offset += len;
                return str;
            }
            case SIA_TYPES.string32: {
                const len = this.dv.getUint32(this.offset, true);
                this.offset += 4;
                const str = this.textDecoder.decode(this.buffer.subarray(this.offset, this.offset + len));
                this.offset += len;
                return str;
            }


            case SIA_TYPES.bin8: {
                const length = this.readUInt8();
                const buf = new Uint8Array(length);
                buf.set(this.buffer.subarray(this.offset, this.offset + length));
                this.offset += length;
                return buf;
            }

            case SIA_TYPES.bin16: {
                const length = this.readUInt16();
                const buf = new Uint8Array(length);
                buf.set(this.buffer.subarray(this.offset, this.offset + length));
                this.offset += length;
                return buf;
            }

            case SIA_TYPES.bin32: {
                const length = this.readUInt32();
                const buf = new Uint8Array(length);
                buf.set(this.buffer.subarray(this.offset, this.offset + length));
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
                    const key = this.readBlock();
                    const value = this.readBlock();
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
                const dv = this.dv;
                // new DataView(
                //     this.buffer.buffer,
                //     this.buffer.byteOffset,
                //     this.buffer.byteLength
                // );

                for (let i = 0; i < chunksCount; i++) {
                    const bytesRead = dv.getBigUint64(this.offset, true); // Little-endian
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
                const dv = this.dv;

                for (let i = 0; i < chunksCount; i++) {
                    const bytesRead = dv.getBigUint64(this.offset, true); // Little-endian
                    bigIntValue += bytesRead << (big_64 * bigIndices[i]);
                    this.offset += 8;
                }
                return bigIntValue;
            }

            // For Int8Array (8-bit length marker variant)
            case SIA_TYPES.int8array8: {
                const length = this.readUInt8();
                const offset = this.offset;
                this.offset += length;
                const slice = this.buffer.slice(offset, offset + length);
                const newBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
                return new Int8Array(newBuffer);
            }

            // For Int8Array (16-bit length marker variant)
            case SIA_TYPES.int8array16: {
                const length = this.readUInt16();
                const offset = this.offset;
                this.offset += length;
                const slice = this.buffer.slice(offset, offset + length);
                const newBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
                return new Int8Array(newBuffer);
            }

            // For Int8Array (32-bit length marker variant)
            case SIA_TYPES.int8array32: {
                const length = this.readUInt32();
                const offset = this.offset;
                this.offset += length;
                const slice = this.buffer.slice(offset, offset + length);
                const newBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
                return new Int8Array(newBuffer);
            }

            // For Uint8Array
            case SIA_TYPES.uint8array8: {
                const length = this.readUInt8();
                const offset = this.offset;
                this.offset += length;
                const result = new Uint8Array(length);
                const slice = this.buffer.slice(offset, offset + length);
                result.set(Uint8Array.from(slice));
                return result;
            }

            case SIA_TYPES.uint8array16: {
                const length = this.readUInt16();
                const offset = this.offset;
                this.offset += length;
                const result = new Uint8Array(length);
                const slice = this.buffer.slice(offset, offset + length);
                result.set(Uint8Array.from(slice));
                return result;
            }

            case SIA_TYPES.uint8array32: {
                const length = this.readUInt32();
                const offset = this.offset;
                this.offset += length;
                const result = new Uint8Array(length);
                const slice = this.buffer.slice(offset, offset + length);
                result.set(Uint8Array.from(slice));
                return result;
            }


            // For Uint8ClampedArray
            case SIA_TYPES.uint8clampedarray8: {
                const length = this.readUInt8();
                const offset = this.offset;
                this.offset += length;
                const result = new Uint8ClampedArray(length);
                const slice = this.buffer.slice(offset, offset + length);
                result.set(Uint8ClampedArray.from(slice));
                return result;
            }

            case SIA_TYPES.uint8clampedarray16: {
                const length = this.readUInt16();
                const offset = this.offset;
                this.offset += length;
                const result = new Uint8ClampedArray(length);
                const slice = this.buffer.slice(offset, offset + length);
                result.set(Uint8ClampedArray.from(slice));
                return result;
            }

            case SIA_TYPES.uint8clampedarray32: {
                const length = this.readUInt32();
                const offset = this.offset;
                this.offset += length;
                const result = new Uint8ClampedArray(length);
                const slice = this.buffer.slice(offset, offset + length);
                result.set(Uint8ClampedArray.from(slice));
                return result;
            }


            // For Int16Array (8-bit length marker variant)
            case SIA_TYPES.int16array8: {
                const length = this.readUInt8();
                const offset = this.offset;
                this.offset += length * 2;
                // Slice the buffer (returns a Node Buffer)
                const slice = this.buffer.slice(offset, offset + length * 2);
                // Create a new ArrayBuffer that contains exactly the data from the slice.
                const newBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
                return new Int16Array(newBuffer);
            }

            // For Int16Array (16-bit length marker variant)
            case SIA_TYPES.int16array16: {
                const length = this.readUInt16();
                const offset = this.offset;
                this.offset += length * 2;
                const slice = this.buffer.slice(offset, offset + length * 2);
                const newBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
                return new Int16Array(newBuffer);
            }

            // For Int16Array (32-bit length marker variant)
            case SIA_TYPES.int16array32: {
                const length = this.readUInt32();
                const offset = this.offset;
                this.offset += length * 2;
                const slice = this.buffer.slice(offset, offset + length * 2);
                const newBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
                return new Int16Array(newBuffer);
            }


            // For Uint16Array (8-bit length marker variant)
            case SIA_TYPES.uint16array8: {
                const length = this.readUInt8();
                const offset = this.offset;
                this.offset += length * 2;
                const slice = this.buffer.slice(offset, offset + length * 2);
                const newBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
                return new Uint16Array(newBuffer);
            }

            // For Uint16Array (16-bit length marker variant)
            case SIA_TYPES.uint16array16: {
                const length = this.readUInt16();
                const offset = this.offset;
                this.offset += length * 2;
                const slice = this.buffer.slice(offset, offset + length * 2);
                const newBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
                return new Uint16Array(newBuffer);
            }

            // For Uint16Array (32-bit length marker variant)
            case SIA_TYPES.uint16array32: {
                const length = this.readUInt32();
                const offset = this.offset;
                this.offset += length * 2;
                const slice = this.buffer.slice(offset, offset + length * 2);
                const newBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
                return new Uint16Array(newBuffer);
            }

            // For Int32Array (8-bit length marker variant)
            case SIA_TYPES.int32array8: {
                const length = this.readUInt8();
                const offset = this.offset;
                this.offset += length * 4;
                const slice = this.buffer.slice(offset, offset + length * 4);
                const newBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
                return new Int32Array(newBuffer);
            }

            // For Int32Array (16-bit length marker variant)
            case SIA_TYPES.int32array16: {
                const length = this.readUInt16();
                const offset = this.offset;
                this.offset += length * 4;
                const slice = this.buffer.slice(offset, offset + length * 4);
                const newBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
                return new Int32Array(newBuffer);
            }

            // For Int32Array (32-bit length marker variant)
            case SIA_TYPES.int32array32: {
                const length = this.readUInt32();
                const offset = this.offset;
                this.offset += length * 4;
                const slice = this.buffer.slice(offset, offset + length * 4);
                const newBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
                return new Int32Array(newBuffer);
            }



            // For Uint32Array (8-bit length marker variant)
            case SIA_TYPES.uint32array8: {
                const length = this.readUInt8();
                const offset = this.offset;
                this.offset += length * 4;
                const slice = this.buffer.slice(offset, offset + length * 4);
                const newBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
                return new Uint32Array(newBuffer);
            }

            // For Uint32Array (16-bit length marker variant)
            case SIA_TYPES.uint32array16: {
                const length = this.readUInt16();
                const offset = this.offset;
                this.offset += length * 4;
                const slice = this.buffer.slice(offset, offset + length * 4);
                const newBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
                return new Uint32Array(newBuffer);
            }

            // For Uint32Array (32-bit length marker variant)
            case SIA_TYPES.uint32array32: {
                const length = this.readUInt32();
                const offset = this.offset;
                this.offset += length * 4;
                const slice = this.buffer.slice(offset, offset + length * 4);
                const newBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
                return new Uint32Array(newBuffer);
            }


            // For Float32Array (8-bit length marker variant)
            case SIA_TYPES.float32array8: {
                const length = this.readUInt8();
                const offset = this.offset;
                this.offset += length * 4;
                const slice = this.buffer.slice(offset, offset + length * 4);
                const newBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
                return new Float32Array(newBuffer);
            }

            // For Float32Array (16-bit length marker variant)
            case SIA_TYPES.float32array16: {
                const length = this.readUInt16();
                const offset = this.offset;
                this.offset += length * 4;
                const slice = this.buffer.slice(offset, offset + length * 4);
                const newBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
                return new Float32Array(newBuffer);
            }

            // For Float32Array (32-bit length marker variant)
            case SIA_TYPES.float32array32: {
                const length = this.readUInt32();
                const offset = this.offset;
                this.offset += length * 4;
                const slice = this.buffer.slice(offset, offset + length * 4);
                const newBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
                return new Float32Array(newBuffer);
            }



            // For Float64Array (8-bit length marker variant)
            case SIA_TYPES.float64array8: {
                const length = this.readUInt8();
                const offset = this.offset;
                this.offset += length * 8;
                const slice = this.buffer.slice(offset, offset + length * 8);
                const newBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
                return new Float64Array(newBuffer);
            }

            // For Float64Array (16-bit length marker variant)
            case SIA_TYPES.float64array16: {
                const length = this.readUInt16();
                const offset = this.offset;
                this.offset += length * 8;
                const slice = this.buffer.slice(offset, offset + length * 8);
                const newBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
                return new Float64Array(newBuffer);
            }

            // For Float64Array (32-bit length marker variant)
            case SIA_TYPES.float64array32: {
                const length = this.readUInt32();
                const offset = this.offset;
                this.offset += length * 8;
                const slice = this.buffer.slice(offset, offset + length * 8);
                const newBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
                return new Float64Array(newBuffer);
            }


            // For BigInt64Array (8-bit length marker variant)
            case SIA_TYPES.bigint64array8: {
                const length = this.readUInt8();
                const offset = this.offset;
                this.offset += length * 8;
                const slice = this.buffer.slice(offset, offset + length * 8);
                const newBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
                return new BigInt64Array(newBuffer);
            }

            // For BigInt64Array (16-bit length marker variant)
            case SIA_TYPES.bigint64array16: {
                const length = this.readUInt16();
                const offset = this.offset;
                this.offset += length * 8;
                const slice = this.buffer.slice(offset, offset + length * 8);
                const newBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
                return new BigInt64Array(newBuffer);
            }

            // For BigInt64Array (32-bit length marker variant)
            case SIA_TYPES.bigint64array32: {
                const length = this.readUInt32();
                const offset = this.offset;
                this.offset += length * 8;
                const slice = this.buffer.slice(offset, offset + length * 8);
                const newBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
                return new BigInt64Array(newBuffer);
            }


            // For BigUint64Array (8-bit length marker variant)
            case SIA_TYPES.biguint64array8: {
                const length = this.readUInt8();
                const offset = this.offset;
                this.offset += length * 8;
                const slice = this.buffer.slice(offset, offset + length * 8);
                const newBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
                return new BigUint64Array(newBuffer);
            }

            // For BigUint64Array (16-bit length marker variant)
            case SIA_TYPES.biguint64array16: {
                const length = this.readUInt16();
                const offset = this.offset;
                this.offset += length * 8;
                const slice = this.buffer.slice(offset, offset + length * 8);
                const newBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
                return new BigUint64Array(newBuffer);
            }

            // For BigUint64Array (32-bit length marker variant)
            case SIA_TYPES.biguint64array32: {
                const length = this.readUInt32();
                const offset = this.offset;
                this.offset += length * 8;
                const slice = this.buffer.slice(offset, offset + length * 8);
                const newBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
                return new BigUint64Array(newBuffer);
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
        const value = this.dv.getUint32(this.offset, true);
        this.offset += 4;
        return value;
    }

    readInt8() {
        const value = this.dv.getInt8(this.offset);
        this.offset += 1;
        return value;
    }

    readInt16() {
        const value = this.dv.getInt16(this.offset, true);
        this.offset += 2;
        return value;
    }

    readInt32() {
        const value = this.dv.getInt32(this.offset, true);
        this.offset += 4;
        return value;
    }

    readBigInt64() {
        const value = this.dv.getBigInt64(this.offset, true);
        this.offset += 8;
        return value;
    }

    readDouble() {
        const value = this.dv.getFloat64(this.offset, true);
        this.offset += 8;
        return value;
    }

    readString(length) {
        // const decoder = new TextDecoder('utf-8');
        const slice = this.buffer.subarray(this.offset, this.offset + length);
        this.offset += length;
        return textDecoder.decode(slice);
    }

    deserialize(buffer) {
        this.buffer = buffer;
        this.reset();
        this.dv = new DataView(
            buffer.buffer,
            buffer.byteOffset,
            buffer.byteLength
        );
        return this.readBlock();
    }
}
export default DeSia;