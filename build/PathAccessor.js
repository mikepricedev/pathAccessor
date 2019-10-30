"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_notation_1 = require("path-notation");
const key_nodes_1 = require("key-nodes");
const TraversePath_1 = require("./TraversePath");
const PATH = Symbol();
class PathAccessor {
    constructor(path) {
        this[PATH] = new path_notation_1.default(path);
    }
    set(doc, value) {
        return PathAccessor.set(this[PATH], doc, value);
    }
    get(doc) {
        return PathAccessor.get(this[PATH], doc);
    }
    getValue(doc) {
        return PathAccessor.getValue(this[PATH], doc);
    }
    // Accessors
    get [Symbol.toStringTag]() {
        return this.constructor.name;
    }
    static *set(path, doc, value) {
        if (path instanceof key_nodes_1.KeyValueNode) {
            // NOTE: May or may not be KeyValueNode.isTerminalKey === true
            const terminalKVNode = path;
            yield terminalKVNode;
            const kVNodeIter = terminalKVNode.pathToKey(true);
            let kVNodeIterResult = kVNodeIter.next();
            let childKVNodeResult = kVNodeIter.next();
            while (kVNodeIterResult.value !== terminalKVNode) {
                const key = kVNodeIterResult.value.key;
                if (!(key in doc) || typeof doc[key] !== 'object' || doc[key] === null) {
                    doc[key] = childKVNodeResult.value.keyType === 'index'
                        ? [] : {};
                }
                doc = doc[key];
                kVNodeIterResult = childKVNodeResult;
                childKVNodeResult = kVNodeIter.next();
            }
            doc[terminalKVNode.key] = terminalKVNode.value;
            return [];
        }
        else {
            const getIter = this.get(path, doc);
            let getIterResult;
            while (!(getIterResult = getIter.next()).done) {
                const kVNode = getIterResult.value;
                const keepHistory = kVNode.keepHistory;
                if (keepHistory === false) {
                    kVNode.keepHistory = 1;
                }
                else if (keepHistory !== true) {
                    kVNode.keepHistory = keepHistory + 1;
                }
                kVNode.value = value;
                yield* this.set(kVNode, doc);
            }
            return getIterResult.value;
        }
    }
    static *get(path, doc) {
        const pathNotation = new path_notation_1.default(path);
        const depth = pathNotation.length - 1;
        const tPIter = new TraversePath_1.default(pathNotation, doc);
        let tpNextResult;
        while (!(tpNextResult = tPIter.next()).done) {
            const kVNode = tpNextResult.value;
            if (kVNode.depth === depth) {
                yield kVNode;
            }
        }
        return tpNextResult.value;
    }
    /**
     * Convenience method that yields the values instead of the KeyValueNodes.
     */
    static *getValue(path, doc) {
        for (const keyValueNode of this.get(path, doc)) {
            yield keyValueNode.value;
        }
    }
}
exports.default = PathAccessor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGF0aEFjY2Vzc29yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1BhdGhBY2Nlc3Nvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlEQUF5QztBQUN6Qyx5Q0FBdUM7QUFDdkMsaURBQTBDO0FBUzFDLE1BQU0sSUFBSSxHQUFpQixNQUFNLEVBQUUsQ0FBQztBQUVwQyxNQUFxQixZQUFZO0lBTy9CLFlBQVksSUFBbUM7UUFFN0MsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksdUJBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUV0QyxDQUFDO0lBRUQsR0FBRyxDQUFDLEdBQVEsRUFBRSxLQUFhO1FBRXpCLE9BQU8sWUFBWSxDQUFDLEdBQUcsQ0FBZSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRWhFLENBQUM7SUFFRCxHQUFHLENBQUMsR0FBUTtRQUVWLE9BQU8sWUFBWSxDQUFDLEdBQUcsQ0FBZSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFFekQsQ0FBQztJQUVELFFBQVEsQ0FBQyxHQUFRO1FBRWYsT0FBTyxZQUFZLENBQUMsUUFBUSxDQUFTLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUV4RCxDQUFDO0lBRUQsWUFBWTtJQUNaLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDO1FBRXRCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUM7SUFFL0IsQ0FBQztJQVFELE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FDUixJQUFnRSxFQUMvRCxHQUF1QixFQUFFLEtBQWE7UUFJeEMsSUFBRyxJQUFJLFlBQVksd0JBQVksRUFBRTtZQUUvQiw4REFBOEQ7WUFDOUQsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDO1lBRTVCLE1BQU0sY0FBYyxDQUFDO1lBRXJCLE1BQU0sVUFBVSxHQUFHLGNBQWMs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