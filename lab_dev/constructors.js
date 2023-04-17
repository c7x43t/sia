export default [
  {
    constructor: RegExp,
    code: 0,
    args: (item) => [item.source, item.flags],
    build(source, flags) {
      return new RegExp(source, flags);
    },
  },
  {
    constructor: Date,
    code: 1,
    args: (item) => [item.valueOf()],
    build(value) {
      return new Date(value);
    },
  },
  {
    constructor: Int8Array,
    code: 2,
    args: (item) => [item.buffer, item.byteOffset, item.length],
    build(buffer, byteOffset, length) {
      return new Int8Array(buffer, byteOffset, length);
    },
  },
  {
    constructor: Uint8Array,
    code: 3,
    args: (item) => [item.buffer, item.byteOffset, item.length],
    build(buffer, byteOffset, length) {
      return new Uint8Array(buffer, byteOffset, length);
    },
  },
  {
    constructor: Uint8ClampedArray,
    code: 4,
    args: (item) => [item.buffer, item.byteOffset, item.length],
    build(buffer, byteOffset, length) {
      return new Uint8ClampedArray(buffer, byteOffset, length);
    },
  },
  {
    constructor: Int16Array,
    code: 5,
    args: (item) => [item.buffer, item.byteOffset, item.length],
    build(buffer, byteOffset, length) {
      return new Int16Array(buffer, byteOffset, length);
    },
  },
  {
    constructor: Uint16Array,
    code: 6,
    args: (item) => [item.buffer, item.byteOffset, item.length],
    build(buffer, byteOffset, length) {
      return new Uint16Array(buffer, byteOffset, length);
    },
  },
  {
    constructor: Int32Array,
    code: 7,
    args: (item) => [item.buffer, item.byteOffset, item.length],
    build(buffer, byteOffset, length) {
      return new Int32Array(buffer, byteOffset, length);
    },
  },
  {
    constructor: Uint32Array,
    code: 8,
    args: (item) => [item.buffer, item.byteOffset, item.length],
    build(buffer, byteOffset, length) {
      return new Uint32Array(buffer, byteOffset, length);
    },
  },
  {
    constructor: Float32Array,
    code: 9,
    args: (item) => [item.buffer, item.byteOffset, item.length],
    build(buffer, byteOffset, length) {
      return new Float32Array(buffer, byteOffset, length);
    },
  },
  {
    constructor: Float64Array,
    code: 10,
    args: (item) => [item.buffer, item.byteOffset, item.length],
    build(buffer, byteOffset, length) {
      return new Float64Array(buffer, byteOffset, length);
    },
  },
  {
    constructor: BigInt64Array,
    code: 11,
    args: (item) => [item.buffer, item.byteOffset, item.length],
    build(buffer, byteOffset, length) {
      return new BigInt64Array(buffer, byteOffset, length);
    },
  },
  {
    constructor: BigUint64Array,
    code: 12,
    args: (item) => [item.buffer, item.byteOffset, item.length],
    build(buffer, byteOffset, length) {
      return new BigUint64Array(buffer, byteOffset, length);
    },
  }
];
