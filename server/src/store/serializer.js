/**
 * Serialize a room object for Redis storage.
 * Handles Set → Array conversion and strips non-serializable fields.
 */
export function serializeRoom(room) {
  return JSON.stringify(room, (key, value) => {
    // Convert Set to Array
    if (value instanceof Set) return { __type: "Set", values: [...value] };
    // Strip timer handles (non-serializable, per-process)
    if (key.endsWith("TimerId")) return null;
    return value;
  });
}

/**
 * Deserialize a room object from Redis storage.
 * Restores Array → Set conversion.
 */
export function deserializeRoom(json) {
  return JSON.parse(json, (_key, value) => {
    // Restore Set from tagged Array
    if (value && value.__type === "Set" && Array.isArray(value.values)) {
      return new Set(value.values);
    }
    return value;
  });
}
