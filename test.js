function circularStringify(obj) {
    let counter = 0;
    const seen = new Map();

    return JSON.stringify(obj, function (key, value) {
        // Only process non-null objects.
        if (value && typeof value === "object") {
            if (value instanceof Realm.BSON.UUID) {
                return { $realm_uuid_id: value.toHexString() };
            } else if (value instanceof Realm.BSON.ObjectId) {
                return { $realm_object_id: value.toHexString() };
            } else {
                if (seen.has(value)) {
                    // Already seen: replace with a reference marker.
                    return { $ref: seen.get(value) };
                }
                // Assign a new ID for this object.
                seen.set(value, counter++);
            }
        }
        return value;
    }, 2);
}

function circularParse(json) {
    // First, do a normal parse.
    const data = JSON.parse(json);
    const refs = new Map();

    // Walk the structure to rebuild object references.
    function restore(obj) {
        if (obj && typeof obj === "object") {
            // If this object is a reference marker, return the actual object.
            if ('$ref' in obj && typeof obj.$ref === 'number') {
                return refs.get(obj.$ref); // Return immediately
            }

            // If this object is a special Realm BSON type, restore it.
            if ('$realm_uuid_id' in obj && typeof obj.$realm_uuid_id === 'string') {
                return new Realm.BSON.UUID(obj.$realm_uuid_id);
            }
            if ('$realm_object_id' in obj && typeof obj.$realm_object_id === 'string') {
                return new Realm.BSON.ObjectId(obj.$realm_object_id);
            }

            // Otherwise, assign this object a new id and store it.
            const id = refs.size;
            const newObj = Array.isArray(obj) ? [] : {}; // Maintain array structure
            refs.set(id, newObj);

            // Recursively restore its children.
            if (Array.isArray(obj)) {
                // Process array elements
                for (let i = 0; i < obj.length; i++) {
                    newObj[i] = restore(obj[i]);
                }
            } else {
                // Process object properties
                for (let key in obj) {
                    if (Object.hasOwn(obj, key)) {
                        newObj[key] = restore(obj[key]);
                    }
                }
            }

            return newObj;
        }
        return obj;
    }

    return restore(data);
}
const Realm = {
    BSON: {
        UUID: class {
            constructor(hex) { this.hex = (hex ?? "656e7c392a8a5a4f347d3b2b"); }
            toHexString() { return this.hex; }
        },
        ObjectId: class {
            constructor(hex) { this.hex = hex ?? "656e7c392a8a5a4f347d3b2b"; }
            toHexString() { return this.hex; }
        }
    }
};

// Test object with Realm BSON types inside an array and circular references
const obj = {
    id: new Realm.BSON.ObjectId("656e7c392a8a5a4f347d3b2b"),
    uuid: new Realm.BSON.UUID("550e8400-e29b-41d4-a716-446655440000"),
    arr: [
        new Realm.BSON.ObjectId("656e7c392a8a5a4f347d3b2b"),
        "test",
        { nested: new Realm.BSON.UUID("550e8400-e29b-41d4-a716-446655440000") }
    ]
};
obj.self = obj; // Circular reference

const json = circularStringify(obj);
console.log("Serialized JSON:", json);

const parsed = circularParse(json);
console.log("Parsed Object:", parsed);

console.log(parsed.self === parsed); // ✅ Should be true
console.log(parsed.id instanceof Realm.BSON.ObjectId); // ✅ Should be true
console.log(parsed.uuid instanceof Realm.BSON.UUID); // ✅ Should be true
console.log(Array.isArray(parsed.arr)); // ✅ Should be true
console.log(parsed.arr[0] instanceof Realm.BSON.ObjectId); // ✅ Should be true
console.log(parsed.arr[2].nested instanceof Realm.BSON.UUID); // ✅ Should be true


// Global registry for special types.
const typeRegistry = [];

/**
 * Registers a special type.
 * @param {Function} type - The constructor (class) to match (using instanceof).
 * @param {string} marker - A unique property name to mark serialized instances.
 * @param {Function} serialize - Function(instance) → serializable data.
 * @param {Function} deserialize - Function(serializedData) → instance.
 */
function register(type, marker, serialize, deserialize) {
    typeRegistry.push({ type, marker, serialize, deserialize });
}

/**
 * Searches the registry for a matching type.
 * @param {object} value - The value to test.
 * @returns {object|null} The registry entry if found, or null.
 */
function findRegisteredType(value) {
    for (let entry of typeRegistry) {
        if (value instanceof entry.type) {
            return entry;
        }
    }
    return null;
}

/**
 * Iterative version of replaceBSONInstances.
 * Walks the object graph and, for each object:
 *   - If it is a registered special type, replaces it with an object of the form { marker: serializedValue }.
 *   - If it’s been seen before (circular reference), replaces it with { $ref: <id> }.
 *   - Otherwise, recurses into its own properties.
 * @param {*} obj - The input value.
 * @returns {*} A new object/array with special types replaced.
 */
function replaceBSONInstances(obj) {
    if (!obj || typeof obj !== "object") return obj;

    const seen = new Map();
    const root = Array.isArray(obj) ? [] : {};
    // Mark the root with a new ID.
    seen.set(obj, seen.size);

    // Each stack frame holds { source, target, keys, index }.
    const stack = [{
        source: obj,
        target: root,
        keys: Object.keys(obj),
        index: 0
    }];

    while (stack.length > 0) {

        const frame = stack[stack.length - 1];

        if (frame.index >= frame.keys.length) {
            stack.pop();
            continue;
        }

        const key = frame.keys[frame.index++];
        const value = frame.source[key];

        if (value && typeof value === "object") {
            // First, check if the value is an instance of a registered type.
            const reg = findRegisteredType(value);
            if (reg) {
                // Call the type's serialize function and wrap it with its marker.
                frame.target[key] = { [reg.marker]: reg.serialize(value) };
            } else {
                // Otherwise, check for circular references.
                if (seen.has(value)) {
                    frame.target[key] = { $ref: seen.get(value) };
                } else {
                    // Create a new object/array, record it, and push a new stack frame.
                    const newObj = Array.isArray(value) ? [] : {};
                    seen.set(value, seen.size);
                    frame.target[key] = newObj;
                    stack.push({
                        source: value,
                        target: newObj,
                        keys: Object.keys(value),
                        index: 0
                    });
                }
            }
        } else {
            // For primitives (or null), simply copy the value.
            frame.target[key] = value;
        }
    }

    return root;
}

/**
 * Iterative version of restoreBSONInstances.
 * Walks the object graph (which may include special marker objects and circular reference markers)
 * and restores the original types:
 *   - If an object has a "$ref" property, it is replaced with the corresponding previously restored object.
 *   - If an object has one of the registered markers, it is replaced by calling the corresponding deserialize function.
 *   - Otherwise, its properties are recursively restored.
 * @param {*} obj - The input value.
 * @returns {*} A new object/array with special types restored.
 */
function restoreBSONInstances(obj) {
    if (!obj || typeof obj !== "object") return obj;

    const refs = new Map();
    const root = Array.isArray(obj) ? [] : {};
    refs.set(refs.size, root);

    const stack = [{
        source: obj,
        target: root,
        keys: Object.keys(obj),
        index: 0
    }];

    while (stack.length > 0) {
        const frame = stack[stack.length - 1];
        if (frame.index >= frame.keys.length) {
            stack.pop();
            continue;
        }
        const key = frame.keys[frame.index++];
        const value = frame.source[key];

        if (value && typeof value === "object") {
            // First, check for a circular reference marker.
            if ('$ref' in value && typeof value.$ref === 'number') {
                frame.target[key] = refs.get(value.$ref);
            } else {
                // Next, check if the object is a serialized registered type.
                let handled = false;
                for (let entry of typeRegistry) {
                    if (entry.marker in value) {
                        // Call the type's deserialize function with the stored data.
                        frame.target[key] = entry.deserialize(value[entry.marker]);
                        handled = true;
                        break;
                    }
                }
                if (!handled) {
                    // Otherwise, create a new object/array, record it, and push a new frame.
                    const newTarget = Array.isArray(value) ? [] : {};
                    const newId = refs.size;
                    refs.set(newId, newTarget);
                    frame.target[key] = newTarget;
                    stack.push({
                        source: value,
                        target: newTarget,
                        keys: Object.keys(value),
                        index: 0
                    });
                }
            }
        } else {
            frame.target[key] = value;
        }
    }

    return root;
}
register(Realm.BSON.UUID, "$realm_uuid_id",
    (instance) => instance.toHexString(),            // Serialize: return a string value
    (data) => new Realm.BSON.UUID(data)          // Deserialize: rebuild from the string
);

register(Realm.BSON.ObjectId, "$realm_object_id",
    (instance) => instance.toHexString(),
    (data) => new Realm.BSON.ObjectId(data)
);

const test = {
    _id: 'test',
    value: 'test',
    test4: {
        test5: new Realm.BSON.ObjectId(),
        test6: new Realm.BSON.UUID(),
        test7: [new Realm.BSON.ObjectId(), new Realm.BSON.UUID()],
    },
    test1: new Realm.BSON.ObjectId(),
    test2: new Realm.BSON.UUID(),
    test3: [new Realm.BSON.ObjectId(), new Realm.BSON.UUID()],
};
test.test8 = test;
// console.log(test);
// console.log((replaceBSONInstances(test), null, 2))
console.log((restoreBSONInstances(replaceBSONInstances(test)), null, 2))







