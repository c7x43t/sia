import Sia from './lib/Sia/Sia.js'
import DeSia from './lib/DeSia/DeSia.js'


const _Sia = new Sia();
const _Desia = new DeSia();

const sia = (data) => _Sia.serialize(data);
const desia = (data) => _Desia.deserialize(data);

export { sia, desia, Sia, DeSia }
