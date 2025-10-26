class StaticMapping {
    #cache;

    constructor(...items) {
        Object.defineProperty(this, "ITEMS", {
            value: items,
            writable: false,
            configurable: false
        });
        this.#cache = {}; 
    }

    #updateCache(key, value) {
        this.#cache = Object.assign(this.#cache, {[key]: value});
    }
    
    getFromCache(key) {
        return this.#cache[key];
    }

    map(key) {
        const cachedValue = this.getFromCache(key);
        if(cachedValue !== undefined) { return cachedValue; }
        for(const [pattern, value] of this.ITEMS) {
            if(pattern instanceof Function) {
                if(pattern(key)) {
                    this.#updateCache(key, value);
                    return value;
                }
            }
            else {
                if(key === pattern) {
                    this.#updateCache(key, value);
                    return value;
                }
                else { continue; }
            }
        }
        return undefined;
    }
}
