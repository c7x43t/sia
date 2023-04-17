import fetch from "node-fetch";
import prettyBytes from "pretty-bytes";
import { unpack, pack } from "msgpackr";
const msgpackr = { unpack, pack }
import { encode, decode } from "cbor-x";
const cborX = { encode, decode }
import Table from "cli-table3";
import { sia, desia } from "../index.js";
import lab from "../lab/index.js";
// import lab2 from "../lab/index.js";
import lab_dev from "../lab_dev/index.js"
import assert from "assert";
import diff from "deep-diff";

const runTests = (data, samples) => {
  const table = new Table({
    head: [
      "Name",
      "Serialize",
      "Deserialize",
      "Total",
      "Ratio",
      "Size",
      "Size ratio",
    ],
  });
  const results = [];
  const bench = (serialize, deserialize, name, n = samples) => {
    console.log(`Running benchmarks for ${name}, ${n} loops`);
    const serTimes = [];
    const deserTimes = [];
    let serialized;
    let result;
    while (n--) {
      const serstart = process.hrtime.bigint();
      serialized = serialize(data);
      const serend = Number(process.hrtime.bigint() - serstart);
      const deserstart = process.hrtime.bigint();
      result = deserialize(serialized);
      const deserend = Number(process.hrtime.bigint() - deserstart);
      serTimes.push(serend);
      deserTimes.push(deserend);
    }
    // console.log(serTimes)
    const medSer = Math.min(...serTimes);
    const medDeser = Math.min(...deserTimes);
    const byteSize = serialized.length;
    const serTime = Math.round(medSer) || medSer;
    const deserTime = Math.round(medDeser) || medDeser;
    const total = serTime + deserTime;
    const _diff = diff(result, data);
    if (_diff) {
      console.log(_diff);
    }
    assert.deepEqual(result, data);
    assert;
    results.push({
      name,
      serTime,
      deserTime,
      total,
      byteSize,
    });
  };

  bench(
    (data) => Buffer.from(JSON.stringify(data)),
    (buf) => JSON.parse(buf.toString()),
    "JSON"
  );

  bench(sia, desia, "Sia");
  // bench(lab.sia, lab.desia, "Sia Lab");

  // // bench(lab2.sia, lab2.desia, "Sia Lab2");
  // bench(lab_dev.sia, lab_dev.desia, "Sia Dev");
  bench(msgpackr.pack, msgpackr.unpack, "MessagePack");
  bench((data) => cborX.encode(data), cborX.decode, "CBOR-X");
  console.log();

  const getTime = (ns) => {
    if (ns > 10000) return `${Math.round(ns / 1000)}ms`;
    return `${ns}ns`;
  };

  const jsonResults = results.filter(({ name }) => name == "JSON").pop();
  const rows = results.map((stat) => [
    stat.name,
    getTime(stat.serTime),
    getTime(stat.deserTime),
    getTime(stat.total),
    Math.round((100 * stat.total) / jsonResults.total) / 100,
    prettyBytes(stat.byteSize),
    Math.round((100 * stat.byteSize) / jsonResults.byteSize) / 100,
  ]);
  table.push(...rows);
  console.log(table.toString());
  console.log();
};

const dataset = [
  {
    title: "Tiny file",
    url: "https://jsonplaceholder.typicode.com/users/1", // Sia, MessagePack
    samples: 10000,
  },
  {
    title: "Small file",
    url: "https://jsonplaceholder.typicode.com/comments", // Sia, MessagePack
    samples: 1000,
  },
  {
    title: "Large file",
    url: "https://jsonplaceholder.typicode.com/photos", // Sia Dev, Messagepack
    samples: 1000,
  },
  {
    title: "Monster file",
    url: "https://github.com/json-iterator/test-data/raw/master/large-file.json", // Sia
    samples: 100,
  },
];

console.log("Downloading the test data");

const start = async () => {
  for (const set of dataset) {
    const { title, url, samples } = set;
    console.log(`Running tests on "${title}"`);
    const data = set.data || (await fetch(url).then((resp) => resp.json()));
    runTests(data, samples);
  }
};

start().catch(console.trace);
