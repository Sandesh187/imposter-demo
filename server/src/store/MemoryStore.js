export class MemoryStore {
  constructor() {
    this._rooms = new Map();
  }

  get(code) {
    return this._rooms.get(code);
  }

  set(code, room) {
    this._rooms.set(code, room);
  }

  delete(code) {
    this._rooms.delete(code);
  }

  has(code) {
    return this._rooms.has(code);
  }

  entries() {
    return this._rooms.entries();
  }

  get size() {
    return this._rooms.size;
  }
}
