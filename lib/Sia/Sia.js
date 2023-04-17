import builtinConstructors from "../constructors.js";
// import SIA_TYPES from "../types.js";
// import utfz from "utfz-lib"; // 341ms     │ 349ms    
// import utfz from "@valentech/utfz-lib" // 309ms     │ 341ms    
// import utfz from "./lab/utfz.js" //  325ms     │ 396ms  
import * as bufferWriteMethodsWrapper from './bufferWriteMethodsWrapper.js';
import * as writePrimitiveTypesMethods from './writePrimitiveTypesMethods.js';
const BufferClass = typeof Buffer === "undefined" ? BufferShim : Buffer;

class Sia {
    constructor({ size = 33554432, constructors = builtinConstructors } = {}) {
        this.map = new Map();
        this.buffer = BufferClass.alloc(size);
        this.offset = 0;
        this.constructors = constructors;
        this.strings = 0;
        this.objects = 0;
        this.objectTracker = new Map();
    }
    reset() {
        this.offset = 0;
        this.strings = 0;
        this.map = new Map();
        this.objects = 0;
        this.objectTracker = new Map();
    }
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
                // At this point we know it's an object
                const prototype = Object.getPrototypeOf(item);
                if (prototype === null) return this.addONull(item);
                const { constructor } = prototype;
                switch (constructor) {
                    case Object: {
                        const ref = this.objectTracker.get(item);
                        if (ref === undefined) {
                            this.objectTracker.set(item, this.objects++);
                        } else {
                            this.addORef(ref);
                            return;
                        }
                        //
                        this.startObject();
                        for (const key in item) {
                            const ref = this.map.get(key);
                            if (ref === undefined) {
                                this.map.set(key, this.strings++);
                                this.addString(key);
                            } else {
                                this.addRef(ref);
                            }
                            this.serializeItem(item[key]);
                        }
                        this.endObject();
                        return;
                    }

                    case Array: {
                        const ref = this.objectTracker.get(item);
                        if (ref === undefined) {
                            this.objectTracker.set(item, this.objects++);
                        } else {
                            this.addORef(ref);
                            return;
                        }
                        //
                        this.startArray(item.length);
                        for (const member of item) {
                            this.serializeItem(member);
                        }
                        return;
                    }

                    case Set: {
                        const ref = this.objectTracker.get(item);
                        if (ref === undefined) {
                            this.objectTracker.set(item, this.objects++);
                        } else {
                            this.addORef(ref);
                            return;
                        }
                        //
                        this.startSet();
                        for (const member of item) {
                            this.serializeItem(member);
                        }
                        this.endSet();
                        return;
                    }

                    case Map: {
                        const ref = this.objectTracker.get(item);
                        if (ref === undefined) {
                            this.objectTracker.set(item, this.objects++);
                        } else {
                            this.addORef(ref);
                            return;
                        }
                        //
                        this.startMap();
                        for (const [key, value] of item) {
                            this.serializeItem(key);
                            this.serializeItem(value);
                        }
                        this.endMap();
                        return;
                    }

                    case Buffer: {
                        this.addBuffer(item);
                        return;
                    }
                    case Int8Array: {
                        this.addInt8Array(item);
                        return;
                    }
                    case Uint8Array: {
                        this.addUint8Array(item);
                        return;
                    }
                    case Uint8ClampedArray: {
                        this.addUint8ClampedArray(item);
                        return;
                    }
                    case Int16Array: {
                        this.addInt16Array(item);
                        return;
                    }
                    case Uint16Array: {
                        this.addUint16Array(item);
                        return;
                    }
                    case Int32Array: {
                        this.addInt32Array(item);
                        return;
                    }
                    case Uint32Array: {
                        this.addUint32Array(item);
                        return;
                    }
                    case Float32Array: {
                        this.addFloat32Array(item);
                        return;
                    }
                    case Float64Array: {
                        this.addFloat64Array(item);
                        return;
                    }
                    case BigInt64Array: {
                        this.addBigInt64Array(item);
                        return;
                    }
                    case BigUint64Array: {
                        this.addBigUint64Array(item);
                        return;
                    }
                    case ArrayBuffer: {
                        this.addArrayBuffer(item);
                        return;
                    }
                    case Date: {
                        this.addDate(item);
                        return;
                    }
                    case RegExp: {
                        this.addRegExp(item);
                        return;
                    }
                    case Number: {
                        this.addONumber(item);
                        return;
                    }

                    case String: {
                        this.addOString(item);
                        return;
                    }

                    case Boolean: {
                        this.addOBoolean(item);
                        return;
                    }

                    default:
                        this.addCustomType(item, constructor);
                        return;
                }
            }
        }
    }
    itemToSia(item, constructor) {
        for (const entry of this.constructors) {
            if (entry.constructor === constructor) {
                return {
                    code: entry.code,
                    args: entry.args(item),
                };
            }
        }
        throw `Serialization of item ${item} is not supported`;
    }
    serialize(data) {
        this.data = data;
        this.reset();
        this.serializeItem(this.data);
        return this.buffer.slice(0, this.offset);
    }
}
Object.assign(Sia.prototype, bufferWriteMethodsWrapper);
Object.assign(Sia.prototype, writePrimitiveTypesMethods);
export default Sia;