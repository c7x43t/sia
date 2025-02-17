// buffers are auto resized here, but at a performance hit
// performance hit, for growing buffers going from 285ms to 439ms (-439ms to 285ms) but still faster than JSON.stringify
const textEncoder = new TextEncoder();

// function writeString(str, offset) {
//     const encoded = textEncoder.encode(str);
//     const end = offset + encoded.length;
//     if (end <= this.buffer.length) {
//         this.buffer.set(encoded, offset);
//         return encoded.length;
//     } else {
//         const bufferSizeNeeded = Math.ceil(Math.log2(end));
//         const newBufferSize = Math.pow(2, bufferSizeNeeded);
//         const newBuffer = new Uint8Array(newBufferSize);
//         newBuffer.set(this.buffer);
//         this.buffer = newBuffer;
//         this.buffer.set(encoded, offset);
//         return encoded.length;
//     }
// }
function writeString(str, offset) {
    // Worst-case byte length is 3 bytes per character.
    const worstCaseLength = str.length * 3;
    const requiredLength = offset + worstCaseLength;

    // Expand the buffer if needed.
    if (requiredLength > this.buffer.length) {
        const newBufferSize = Math.pow(2, Math.ceil(Math.log2(requiredLength)));
        const newBuffer = new Uint8Array(newBufferSize);
        newBuffer.set(this.buffer);
        this.buffer = newBuffer;
    }

    // Use encodeInto to directly write into the existing buffer.
    const view = this.buffer.subarray(offset);
    const { written } = textEncoder.encodeInto(str, view);
    return written;
}

function writeUInt8(number) {
    const offset = this.offset;
    const end = offset + 1;
    if (end <= this.buffer.length) {
        this.buffer[offset] = number;
        this.offset += 1;
        return this.offset;
    } else {
        const bufferSizeNeeded = Math.ceil(Math.log2(end));
        const newBufferSize = Math.pow(2, bufferSizeNeeded);
        const newBuffer = new Uint8Array(newBufferSize);
        newBuffer.set(this.buffer);
        this.buffer = newBuffer;
        this.buffer[offset] = number;
        this.offset += 1;
        return this.offset;
    }
}

function writeUInt16(number) {
    const end = this.offset + 2;
    if (end <= this.buffer.length) {
        new DataView(this.buffer.buffer).setUint16(this.offset, number, true);
        this.offset += 2;
        return this.offset;
    } else {
        const bufferSizeNeeded = Math.ceil(Math.log2(end));
        const newBufferSize = Math.pow(2, bufferSizeNeeded);
        const newBuffer = new Uint8Array(newBufferSize);
        newBuffer.set(this.buffer);
        this.buffer = newBuffer;
        new DataView(this.buffer.buffer).setUint16(this.offset, number, true);
        this.offset += 2;
        return this.offset;
    }
}

function writeUInt32(number) {
    const end = this.offset + 4;
    if (end <= this.buffer.length) {
        new DataView(this.buffer.buffer).setUint32(this.offset, number, true);
        this.offset += 4;
        return this.offset;
    } else {
        const bufferSizeNeeded = Math.ceil(Math.log2(end));
        const newBufferSize = Math.pow(2, bufferSizeNeeded);
        const newBuffer = new Uint8Array(newBufferSize);
        newBuffer.set(this.buffer);
        this.buffer = newBuffer;
        new DataView(this.buffer.buffer).setUint32(this.offset, number, true);
        this.offset += 4;
        return this.offset;
    }
}

function writeBigUInt64(number) {
    const end = this.offset + 8;
    if (end <= this.buffer.length) {
        new DataView(this.buffer.buffer).setBigUint64(this.offset, number, true);
        this.offset += 8;
        return this.offset;
    } else {
        const bufferSizeNeeded = Math.ceil(Math.log2(end));
        const newBufferSize = Math.pow(2, bufferSizeNeeded);
        const newBuffer = new Uint8Array(newBufferSize);
        newBuffer.set(this.buffer);
        this.buffer = newBuffer;
        new DataView(this.buffer.buffer).setBigUint64(this.offset, number, true);
        this.offset += 8;
        return this.offset;
    }
}

function writeBigUInt64AtOffset(number, offset) {
    const end = offset + 8;
    if (end <= this.buffer.length) {
        new DataView(this.buffer.buffer).setBigUint64(offset, number, true);
        return offset + 8;
    } else {
        const bufferSizeNeeded = Math.ceil(Math.log2(end));
        const newBufferSize = Math.pow(2, bufferSizeNeeded);
        const newBuffer = new Uint8Array(newBufferSize);
        newBuffer.set(this.buffer);
        this.buffer = newBuffer;
        new DataView(this.buffer.buffer).setBigUint64(offset, number, true);
        return offset + 8;
    }
}

function writeInt8(number) {
    const end = this.offset + 1;
    if (end <= this.buffer.length) {
        new DataView(this.buffer.buffer).setInt8(this.offset, number);
        this.offset += 1;
        return this.offset;
    } else {
        const bufferSizeNeeded = Math.ceil(Math.log2(end));
        const newBufferSize = Math.pow(2, bufferSizeNeeded);
        const newBuffer = new Uint8Array(newBufferSize);
        newBuffer.set(this.buffer);
        this.buffer = newBuffer;
        new DataView(this.buffer.buffer).setInt8(this.offset, number);
        this.offset += 1;
        return this.offset;
    }
}

function writeInt16(number) {
    const end = this.offset + 2;
    if (end <= this.buffer.length) {
        new DataView(this.buffer.buffer).setInt16(this.offset, number, true);
        this.offset += 2;
        return this.offset;
    } else {
        const bufferSizeNeeded = Math.ceil(Math.log2(end));
        const newBufferSize = Math.pow(2, bufferSizeNeeded);
        const newBuffer = new Uint8Array(newBufferSize);
        newBuffer.set(this.buffer);
        this.buffer = newBuffer;
        new DataView(this.buffer.buffer).setInt16(this.offset, number, true);
        this.offset += 2;
        return this.offset;
    }
}

function writeInt32(number) {
    const end = this.offset + 4;
    if (end <= this.buffer.length) {
        new DataView(this.buffer.buffer).setInt32(this.offset, number, true);
        this.offset += 4;
        return this.offset;
    } else {
        const bufferSizeNeeded = Math.ceil(Math.log2(end));
        const newBufferSize = Math.pow(2, bufferSizeNeeded);
        const newBuffer = new Uint8Array(newBufferSize);
        newBuffer.set(this.buffer);
        this.buffer = newBuffer;
        new DataView(this.buffer.buffer).setInt32(this.offset, number, true);
        this.offset += 4;
        return this.offset;
    }
}
function writeBigInt64(number) {
    const end = this.offset + 8;
    if (end <= this.buffer.length) {
        new DataView(this.buffer.buffer).setBigInt64(this.offset, number, true);
        this.offset += 8;
        return this.offset;
    } else {
        const bufferSizeNeeded = Math.ceil(Math.log2(end));
        const newBufferSize = Math.pow(2, bufferSizeNeeded);
        const newBuffer = new Uint8Array(newBufferSize);
        newBuffer.set(this.buffer);
        this.buffer = newBuffer;
        new DataView(this.buffer.buffer).setBigInt64(this.offset, number, true);
        this.offset += 8;
        return this.offset;
    }
}
function writeDouble(number) {
    const end = this.offset + 8;
    if (end <= this.buffer.length) {
        new DataView(this.buffer.buffer).setFloat64(this.offset, number, true);
        this.offset += 8;
        return this.offset;
    } else {
        const bufferSizeNeeded = Math.ceil(Math.log2(end));
        const newBufferSize = Math.pow(2, bufferSizeNeeded);
        const newBuffer = new Uint8Array(newBufferSize);
        newBuffer.set(this.buffer);
        this.buffer = newBuffer;
        new DataView(this.buffer.buffer).setFloat64(this.offset, number, true);
        this.offset += 8;
        return this.offset;
    }
}

export {
    writeString,
    writeUInt8,
    writeUInt16,
    writeUInt32,
    writeBigUInt64,
    writeBigUInt64AtOffset,
    writeInt8,
    writeInt16,
    writeInt32,
    writeBigInt64,
    writeDouble
}