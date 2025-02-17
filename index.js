import Sia from './lib/Sia/Sia.js'
import DeSia from './lib/DeSia/DeSia.js'


const _Sia = new Sia();
const _Desia = new DeSia();

const sia = (data) => _Sia.serialize(data);
const desia = (data) => _Desia.deserialize(data);

export { sia, desia, Sia, DeSia }


// var arrs = [
//     new Int8Array(10),
//     new Uint8Array(10),
//     new Uint8ClampedArray(10),
//     new Int16Array(10),
//     new Uint16Array(10),
//     new Int32Array(10),
//     new Uint32Array(10),
//     new Float32Array(10),
//     new Float64Array(10),
//     // // // BigInt support is not available in all environments
//     // typeof BigInt64Array !== 'undefined' ? new BigInt64Array(10) : null,
//     // typeof BigUint64Array !== 'undefined' ? new BigUint64Array(10) : null,
// ].filter(Boolean);

// var nested = new Map([[1, 2], [3, 4]]);
// var set_1 = new Set([3, 4, 5]);
// nested.set('set', set_1)
// var o = {}
// var o_n = Object.create(null);
// var m = new Map();
// var s = new Set();
// m.set(0, m);
// s.add(s);
// s.add(m)
// s.add(o);
// s.add(nested);
// s.add(set_1);
// s.add(o_n);
// var a = [undefined, o, s, m, nested, set_1, o_n]
// o.o = o
// o.m = m;
// o.s = s;
// o.a = a;
// o.o_n = o_n;
// o.nested = nested;
// o.set_1 = set_1;
// o_n.o = o
// o_n.m = m;
// o_n.s = s;
// o_n.a = a;
// o_n.o_n = o_n;
// o_n.nested = nested;
// o_n.set_1 = set_1;
// a[0] = a
// o.arrs = arrs


// console.log(o, desia(sia(
//     o)))

// function wait() {
//     setTimeout(wait, 500)
// }
// wait();
