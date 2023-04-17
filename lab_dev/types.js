const typeNames_ = [
  "null", //
  "undefined", // 
  "uint8", //
  "uint16", //
  "uint32", //
  "uint64",
  "uint128",
  "uintn",
  "int8", //
  "int16", //
  "int32", //
  "int64",
  "int128",
  "intn",
  "float8",
  "float16",
  "float32",
  "float64", //
  "float128",
  "floatn",
  "record",
  "ref8",
  "ref16",
  "ref32",
  "ref64",
  "ref128",
  "refn",
  "cachedString",
  "string8",
  "string16",
  "string32",
  "string64",
  "string128",
  "stringn",
  "bin8",
  "bin16",
  "bin32",
  "bin64",
  "bin128",
  "binN",
  "true", // 
  "false", // 
  "date",
  "date64",
  "constructor8",
  "constructor16",
  "constructor32",
  "array8",
  "array16",
  "array32",
  "array64",
  "array128",
  "array8",
  "array16",
  "array32",
  "array64",
  "array128",
  "objectStart",
  "objectEnd",
  "setStart",
  "setEnd",
  "mapStart",
  "mapEnd",
];
const typeNames = [
  "null",
  "undefined",
  "true",
  "false",
  "uint8",
  "uint16",
  "uint32",
  "int8",
  "int16",
  "int32",
  "float64",
  "utfz", // 
  "string8", //
  "string16", //
  "string32", //
  "utfz8",
  "utfz16",
  "utfz32",
  "objectStart",
  "objectEnd",
  "ref8",
  "ref16",
  "ref32",
  "array8",
  "array16",
  "array32"
]


const types = Object.fromEntries(typeNames.map((name, index) => [name, index]));

export default types;
/* for (const [name, index] of Object.entries(types)) {
  console.log(
    `| ${name.padEnd(16, " ")} | ${index.toString().padEnd(8, " ")} |0b${index
      .toString(2)
      .padStart(8, "0")} | 0x${index.toString(16).padEnd(2, " ")} |`
  );
} */
