// buffers are auto resized here, but at a performance hit
// performance hit, for growing buffers going from 285ms to 439ms (-439ms to 285ms) but still faster than JSON.stringify
function writeString(str, offset) {
    let end = offset + str.length * 3;
    if (end < this.buffer.length) {
        return this.buffer.write(str, offset);
    } else {
        const bufferSizeNeeded = Math.ceil(Math.log2(end));
        const newBufferSize = Math.pow(2, bufferSizeNeeded);
        const buf = BufferClass.alloc(newBufferSize);
        this.buffer.copy(buf);
        this.buffer = buf;
        return this.buffer.write(str, offset);
    }
}
function writeUInt8(number) {
    const buffer = this.buffer;
    const offset = this.offset;
    if (offset + 1 < buffer.length) {
        buffer[offset] = number;
        return this.offset += 1;
    } else {
        const bufferSizeNeeded = Math.ceil(Math.log2(end));
        const newBufferSize = Math.pow(2, bufferSizeNeeded);
        const buf = BufferClass.alloc(newBufferSize);
        this.buffer.copy(buf);
        this.buffer = buf;
        buffer[offset] = number;
        this.offset += 1;
    }
}
function writeUInt16(number) {
    // this.buffer.writeUInt16LE(number, this.offset);
    // this is a tiny bit more faster than the native method
    let end = this.offset + 2;
    if (end < this.buffer.length) {
        this.buffer[this.offset] = number & 0xff;
        this.buffer[this.offset + 1] = number >> 8;
        return this.offset += 2;
    } else {
        const bufferSizeNeeded = Math.ceil(Math.log2(end));
        const newBufferSize = Math.pow(2, bufferSizeNeeded);
        const buf = BufferClass.alloc(newBufferSize);
        this.buffer.copy(buf);
        this.buffer = buf;
        this.buffer[this.offset] = number & 0xff;
        this.buffer[this.offset + 1] = number >> 8;
        this.offset += 2;
    }
}
function writeUInt32(number) {
    let end = this.offset + 4;
    if (end < this.buffer.length) {
        this.buffer.writeUInt32LE(number, this.offset);
        return this.offset += 4;
    } else {
        const bufferSizeNeeded = Math.ceil(Math.log2(end));
        const newBufferSize = Math.pow(2, bufferSizeNeeded);
        const buf = BufferClass.alloc(newBufferSize);
        this.buffer.copy(buf);
        this.buffer = buf;
        //
        this.buffer.writeUInt32LE(number, this.offset);
        this.offset += 4;
    }

}
function writeBigUInt64(number) {
    let end = this.offset + 8;
    if (end < this.buffer.length) {
        this.buffer.writeBigUInt64LE(number, this.offset);
        return this.offset += 8;
    } else {
        const bufferSizeNeeded = Math.ceil(Math.log2(end));
        const newBufferSize = Math.pow(2, bufferSizeNeeded);
        const buf = BufferClass.alloc(newBufferSize);
        this.buffer.copy(buf);
        this.buffer = buf;
        this.buffer.writeBigUInt64LE(number, this.offset);
        this.offset += 8;
    }
}
function writeBigUInt64AtOffset(number, offset) {
    let end = offset + 8;
    if (end < this.buffer.length) {
        this.buffer.writeBigUInt64LE(number, offset);
        return offset += 8;
    } else {
        const bufferSizeNeeded = Math.ceil(Math.log2(end));
        const newBufferSize = Math.pow(2, bufferSizeNeeded);
        const buf = BufferClass.alloc(newBufferSize);
        this.buffer.copy(buf);
        this.buffer = buf;
        this.buffer.writeBigUInt64LE(number, offset);
        offset += 8;
    }
}
function writeInt8(number) {
    let end = this.offset + 1;
    if (end < this.buffer.length) {
        this.buffer.writeInt8(number, this.offset);
        return this.offset += 1;
    } else {
        const bufferSizeNeeded = Math.ceil(Math.log2(end));
        const newBufferSize = Math.pow(2, bufferSizeNeeded);
        const buf = BufferClass.alloc(newBufferSize);
        this.buffer.copy(buf);
        this.buffer = buf;
        this.buffer.writeInt8(number, this.offset);
        this.offset += 1;
    }

}
function writeInt16(number) {
    let end = this.offset + 2;
    if (end < this.buffer.length) {
        this.buffer.writeInt16LE(number, this.offset);
        return this.offset += 2;
    } else {
        const bufferSizeNeeded = Math.ceil(Math.log2(end));
        const newBufferSize = Math.pow(2, bufferSizeNeeded);
        const buf = BufferClass.alloc(newBufferSize);
        this.buffer.copy(buf);
        this.buffer = buf;
        this.buffer.writeInt16LE(number, this.offset);
        this.offset += 2;
    }

}
function writeInt32(number) {
    let end = this.offset + 4;
    if (end < this.buffer.length) {
        this.buffer.writeInt32LE(number, this.offset);
        return this.offset += 4;
    } else {
        const bufferSizeNeeded = Math.ceil(Math.log2(end));
        const newBufferSize = Math.pow(2, bufferSizeNeeded);
        const buf = BufferClass.alloc(newBufferSize);
        this.buffer.copy(buf);
        this.buffer = buf;
        this.buffer.writeInt32LE(number, this.offset);
        this.offset += 4;
    }

}
function writeBigInt64(number) {
    let end = this.offset + 8;
    if (end < this.buffer.length) {
        this.buffer.writeBigInt64LE(number, this.offset);
        return this.offset += 8;
    } else {
        const bufferSizeNeeded = Math.ceil(Math.log2(end));
        const newBufferSize = Math.pow(2, bufferSizeNeeded);
        const buf = BufferClass.alloc(newBufferSize);
        this.buffer.copy(buf);
        this.buffer = buf;
        this.buffer.writeBigInt64LE(number, this.offset);
        this.offset += 8;
    }
}
function writeDouble(number) {
    let end = this.offset + 8;
    if (end < this.buffer.length) {
        this.buffer.writeDoubleLE(number, this.offset);
        return this.offset += 8;
    } else {
        const bufferSizeNeeded = Math.ceil(Math.log2(end));
        const newBufferSize = Math.pow(2, bufferSizeNeeded);
        const buf = BufferClass.alloc(newBufferSize);
        this.buffer.copy(buf);
        this.buffer = buf;
        this.buffer.writeDoubleLE(number, this.offset);
        this.offset += 8;
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