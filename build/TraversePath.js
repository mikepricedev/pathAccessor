"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const path_notation_1 = require("path-notation");
const key_nodes_1 = require("key-nodes");
const TraversePathResult_1 = require("./TraversePathResult");
const CREATE_ROOT_KEY = Symbol();
const COULD_NOT_FOLLOW = Symbol();
const KEY_VALUE_NODE_ITERATOR = Symbol();
const FOLLOW_DEPTH = Symbol();
const ITERATOR = Symbol();
const A_ROOT_KEY = Symbol();
var TraversePathNextArg;
(function (TraversePathNextArg) {
    TraversePathNextArg[TraversePathNextArg["continue"] = 0] = "continue";
    TraversePathNextArg[TraversePathNextArg["follow"] = 1] = "follow";
    TraversePathNextArg[TraversePathNextArg["return"] = 2] = "return";
})(TraversePathNextArg || (TraversePathNextArg = {}));
/**
 * [[TraversePath]] is an IterableIterator that iterates the key/values of a
 * object path.
 * @param path Path to traverse in @param doc.
 * @note
 * The @param path accepts wildcard keys `"*"`.  A wildcard key will trigger a
 * breath first traverse of all enumerable object keys and their decedents at
 * that depth.
 */
class TraversePath {
    constructor(path, doc) {
        this[_a] = [];
        this[_b] = 0;
        this[ITERATOR] =
            this[KEY_VALUE_NODE_ITERATOR](doc, new path_notation_1.default(path), 0);
    }
    // Accessors
    get followDepth() {
        return this[FOLLOW_DEPTH];
    }
    /**
     * KeyValueNode breakpoints where wildcard keys had no key literals on doc.
     */
    get couldNotFollow() {
        return [...this[COULD_NOT_FOLLOW]];
    }
    get [(_a = COULD_NOT_FOLLOW, _b = FOLLOW_DEPTH, Symbol.toStringTag)]() {
        return this.constructor.name;
    }
    // Methods
    /**
     *
     * @param follow When traversing wildcard keys, calling `true` will trigger a
     * depth first traverse of that key's decedents in the path. Once the decedent
     * keys have been traversed or [[TraversePath.return]] is
     * called, breadth first traversing of remaining wildcard keys and their
     * decedents will resume.
     * @note
     * If `true` is passed to @param follow on a non-wildcard key, it will
     * be ignored.
     * @note
     * [[TraversePathResult.isWildCard]] indicates when a key is a wildcard
     * key.
     */
    next(follow = false) {
        const result = this[ITERATOR].next(follow ? TraversePathNextArg.follow
            : TraversePathNextArg.continue);
        return result.done === false ?
            new TraversePathResult_1.default(false, result.value[0], result.value[1])
            :
                new TraversePathResult_1.default(true, [...this[COULD_NOT_FOLLOW]], null);
    }
    /**
     * If called during the depth first traverse of a wildcard key's decedents,
     * the iteration will resume breadth first traversing of remaining wildcard
     * sibling keys and their decedents.  Else iteration will exit with done flag
     * `true`.
     * @note
     * To exit multiple nested wildcard depth first traverses, call return
     * for each.  The number of currently followed nested wildcard key paths can
     * be retrieved from [[TraversePath.followDepth]].
     * @note If [[TraversePath.followDepth]] is `0`, calling this method will exit
     * iteration with done flag `true`.
     */
    return() {
        const result = this[ITERATOR].next(TraversePathNextArg.return);
        return result.done === false ?
            new TraversePathResult_1.default(false, result.value[0], result.value[1])
            :
                new TraversePathResult_1.default(true, [...this[COULD_NOT_FOLLOW]], null);
    }
    *[KEY_VALUE_NODE_ITERATOR](doc, path, depth, parentKeyValueNode) {
        // End of path
        if (path.length === depth) {
            return;
        }
        const kVNodeIterationOrder = [{
                depth,
                parentKeyValueNode,
                path,
                doc,
                isWildcard: false
            }];
        for (const kVNodeNextResult of kVNodeIterationOrder.values()) {
            // Get a local scope copy of path, doc, and depth
            let path = kVNodeNextResult.path;
            const { depth, doc } = kVNodeNextResult;
            let key = path[depth];
            const docIsObject = typeof doc === 'object' && doc !== null;
            // Wild card key start breadth first iteration
            if (key === '*') {
                if (!docIsObject) {
                    this[COULD_NOT_FOLLOW].push(kVNodeNextResult.parentKeyValueNode);
                    continue;
                }
                const keysIter = TraversePath.keys(doc);
                let keysIterResult = keysIter.next();
                if (keysIterResult.done === true) {
                    this[COULD_NOT_FOLLOW].push(kVNodeNextResult.parentKeyValueNode);
                    continue;
                }
                do {
                    key = keysIterResult.value;
                    // Escape wildcard key literals
                    key = key === "*" ? `\\${key}` : key;
                    path = new path_notation_1.default(path);
                    // Replace wild card with key literal
                    path[depth] = key;
                    kVNodeIterationOrder.push(Object.assign(Object.assign({}, kVNodeNextResult), { path, isWildcard: true }));
                    keysIterResult = keysIter.next();
                } while (!keysIterResult.done);
                continue;
            }
            // Unescape wild card key
            key = key === "\\*" ? "*" : key;
            let value = docIsObject ? doc[key] : undefined;
            const keyValueNode = depth === 0 ?
                this[CREATE_ROOT_KEY](key, value)
                :
                    kVNodeNextResult.parentKeyValueNode.addChild(key, value);
            const nextResult = yield [keyValueNode, kVNodeNextResult.isWildcard];
            const nextDepth = depth + 1;
            if (value !== keyValueNode.value) {
                value = keyValueNode.value;
            }
            // End of path
            if (nextDepth === path.length) {
                continue;
            }
            switch (nextResult) {
                case TraversePathNextArg.follow:
                    // When follow is called on a non-wild card key, ignore.
                    if (kVNodeNextResult.isWildcard) {
                        this[FOLLOW_DEPTH]++;
                        yield* this[KEY_VALUE_NODE_ITERATOR](value, path, nextDepth, keyValueNode);
                        this[FOLLOW_DEPTH]--;
                        break;
                    }
                case TraversePathNextArg.continue:
                    kVNodeIterationOrder.push({
                        depth: nextDepth,
                        parentKeyValueNode: keyValueNode,
                        path,
                        doc: value,
                        isWildcard: false
                    });
                    break;
                case TraversePathNextArg.return:
                    return;
            }
        }
    }
    [CREATE_ROOT_KEY](key, value) {
        if (this[A_ROOT_KEY] === undefined) {
            this[A_ROOT_KEY] = new key_nodes_1.KeyValueNode(key, value);
            return this[A_ROOT_KEY];
        }
        return this[A_ROOT_KEY].addSibling(key, value);
    }
    [Symbol.iterator]() {
        return this;
    }
    // Static methods
    static *keys(doc) {
        if (Array.isArray(doc)) {
            let i = 0;
            for (const value of doc.values()) {
                yield i++;
            }
        }
        else {
            for (const key in doc) {
                if (typeof key === 'string'
                    && Object.prototype.hasOwnProperty.call(doc, key)) {
                    yield key;
                }
            }
        }
    }
}
exports.default = TraversePath;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHJhdmVyc2VQYXRoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1RyYXZlcnNlUGF0aC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxpREFBeUM7QUFDekMseUNBQXVDO0FBQ3ZDLDZEQUFzRDtBQUV0RCxNQUFNLGVBQWUsR0FBaUIsTUFBTSxFQUFFLENBQUM7QUFDL0MsTUFBTSxnQkFBZ0IsR0FBaUIsTUFBTSxFQUFFLENBQUM7QUFDaEQsTUFBTSx1QkFBdUIsR0FBaUIsTUFBTSxFQUFFLENBQUM7QUFDdkQsTUFBTSxZQUFZLEdBQWlCLE1BQU0sRUFBRSxDQUFDO0FBQzVDLE1BQU0sUUFBUSxHQUFpQixNQUFNLEVBQUUsQ0FBQztBQUN4QyxNQUFNLFVBQVUsR0FBaUIsTUFBTSxFQUFFLENBQUM7QUFFMUMsSUFBSyxtQkFJSjtBQUpELFdBQUssbUJBQW1CO0lBQ3RCLHFFQUFRLENBQUE7SUFDUixpRUFBTSxDQUFBO0lBQ04saUVBQU0sQ0FBQTtBQUNSLENBQUMsRUFKSSxtQkFBbUIsS0FBbkIsbUJBQW1CLFFBSXZCO0FBVUQ7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFxQixZQUFZO0lBUy9CLFlBQVksSUFBbUMsRUFBRSxHQUF1QjtRQUx2RCxRQUFrQixHQUFrQixFQUFFLENBQUM7UUFFaEQsUUFBYyxHQUFVLENBQUMsQ0FBQztRQUtoQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ1osSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksdUJBQVksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUVsRSxDQUFDO0lBQ0QsWUFBWTtJQUNaLElBQUksV0FBVztRQUViLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBRTVCLENBQUM7SUFFRDs7T0FFRztJQUNILElBQUksY0FBYztRQUVoQixPQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO0lBRXJDLENBQUM7SUFFRCxJQUFJLE9BM0JjLGdCQUFnQixPQUV6QixZQUFZLEVBeUJoQixNQUFNLENBQUMsV0FBVyxFQUFDO1FBRXRCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUM7SUFFL0IsQ0FBQztJQUVELFVBQVU7SUFFVjs7Ozs7Ozs7Ozs7OztPQWFHO0lBQ0gsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLO1FBSWpCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNO1lBQ3BFLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVsQyxPQUFPLE1BQU0sQ0FBQyxJQUFJLEtBQUssS0FBSyxDQUFDLENBQUM7WUFDNUIsSUFBSSw0QkFBa0IsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9ELENBQUM7Z0JBQ0QsSUFBSSw0QkFBa0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFFcEUsQ0FBQztJQUVEOzs7Ozs7Ozs7OztPQVdHO0lBQ0gsTUFBTTtRQUlKLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFL0QsT0FBTyxNQUFNLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxDQUFDO1lBQzVCLElBQUksNEJBQWtCLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvRCxDQUFDO2dCQUNELElBQUksNEJBQWtCLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBR3BFLENBQUM7SUFFTyxDQUFDLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxHQUF1QixFQUFFLElBQWlCLEVBQzNFLEtBQVksRUFBRSxrQkFBZ0M7UUFHOUMsY0FBYztRQUNkLElBQUcsSUFBSSxDQUFDLE1BQU0sS0FBSyxLQUFLLEVBQUU7WUFFeEIsT0FBTztTQUVSO1FBRUQsTUFBTSxvQkFBb0IsR0FBRyxDQUFDO2dCQUM1QixLQUFLO2dCQUNMLGtCQUFrQjtnQkFDbEIsSUFBSTtnQkFDSixHQUFHO2dCQUNILFVBQVUsRUFBQyxLQUFLO2FBQ2pCLENBQUMsQ0FBQztRQUVILEtBQUksTUFBTSxnQkFBZ0IsSUFBSSxvQkFBb0IsQ0FBQyxNQUFNLEVBQUUsRUFBRTtZQUUzRCxpREFBaUQ7WUFDakQsSUFBSSxJQUFJLEdBQUcsZ0JBQWdCLENBQUMsSUFBSSxDQUFDO1lBQ2pDLE1BQU0sRUFBQyxLQUFLLEVBQUUsR0FBRyxFQUFDLEdBQUcsZ0JBQWdCLENBQUM7WUFFdEMsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRXRCLE1BQU0sV0FBVyxHQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsSUFBSSxHQUFHLEtBQUssSUFBSSxDQUFDO1lBRTdELDhDQUE4QztZQUM5QyxJQUFHLEdBQUcsS0FBSyxHQUFHLEVBQUU7Z0JBRWQsSUFBRyxDQUFDLFdBQVcsRUFBRTtvQkFFZixJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCLENBQUMsQ0FBQztvQkFDakUsU0FBUztpQkFFVjtnQkFFRCxNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN4QyxJQUFJLGNBQWMsR0FBRyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBRXJDLElBQUcsY0FBYyxDQUFDLElBQUksS0FBSyxJQUFJLEVBQUU7b0JBRS9CLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO29CQUNqRSxTQUFTO2lCQUVWO2dCQUVELEdBQUc7b0JBRUQsR0FBRyxHQUFHLGNBQWMsQ0FBQyxLQUFLLENBQUM7b0JBRTNCLCtCQUErQjtvQkFDL0IsR0FBRyxHQUFHLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztvQkFFckMsSUFBSSxHQUFHLElBQUksdUJBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFFOUIscUNBQXFDO29CQUNyQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxDQUFDO29CQUVsQixvQkFBb0IsQ0FBQyxJQUFJLGlDQUNwQixnQkFBZ0IsS0FDbkIsSUFBSSxFQUNKLFVBQVUsRUFBQyxJQUFJLElBQ2YsQ0FBQztvQkFFSCxjQUFjLEdBQUcsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO2lCQUVsQyxRQUFPLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRTtnQkFFOUIsU0FBUzthQUVWO1lBRUQseUJBQXlCO1lBQ3pCLEdBQUcsR0FBRyxHQUFHLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztZQUVoQyxJQUFJLEtBQUssR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBRS9DLE1BQU0sWUFBWSxHQUFHLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDaEMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUM7Z0JBQ2pDLENBQUM7b0JBQ0QsZ0JBQWdCLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUUzRCxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsWUFBWSxFQUFFLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRXJFLE1BQU0sU0FBUyxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUM7WUFFNUIsSUFBRyxLQUFLLEtBQUssWUFBWSxDQUFDLEtBQUssRUFBRTtnQkFFL0IsS0FBSyxHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUM7YUFFNUI7WUFFRCxjQUFjO1lBQ2QsSUFBRyxTQUFTLEtBQUssSUFBSSxDQUFDLE1BQU0sRUFBRTtnQkFFNUIsU0FBUzthQUVWO1lBRUQsUUFBTyxVQUFVLEVBQUU7Z0JBRWpCLEtBQUssbUJBQW1CLENBQUMsTUFBTTtvQkFFN0Isd0RBQXdEO29CQUN4RCxJQUFHLGdCQUFnQixDQUFDLFVBQVUsRUFBRTt3QkFFOUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUM7d0JBRXJCLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUN6RCxZQUFZLENBQUMsQ0FBQzt3QkFFaEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUM7d0JBRXJCLE1BQU07cUJBRVA7Z0JBRUgsS0FBSyxtQkFBbUIsQ0FBQyxRQUFRO29CQUUvQixvQkFBb0IsQ0FBQyxJQUFJLENBQUM7d0JBQ3hCLEtBQUssRUFBQyxTQUFTO3dCQUNmLGtCQUFrQixFQUFDLFlBQVk7d0JBQy9CLElBQUk7d0JBQ0osR0FBRyxFQUFDLEtBQUs7d0JBQ1QsVUFBVSxFQUFDLEtBQUs7cUJBQ2pCLENBQUMsQ0FBQztvQkFFSCxNQUFNO2dCQUdSLEtBQUssbUJBQW1CLENBQUMsTUFBTTtvQkFFN0IsT0FBTzthQUVWO1NBRUY7SUFFSCxDQUFDO0lBRU8sQ0FBQyxlQUFlLENBQUMsQ0FBQyxHQUFtQixFQUFFLEtBQXlCO1FBS3RFLElBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLFNBQVMsRUFBRTtZQUVqQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsSUFBSSx3QkFBWSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUVoRCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUV6QjtRQUVELE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFakQsQ0FBQztJQUVELENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQztRQUVmLE9BQU8sSUFBSSxDQUFDO0lBRWQsQ0FBQztJQUVELGlCQUFpQjtJQUNqQixNQUFNLENBQUMsQ0FBQyxJQUFJLENBQ1YsR0FBUTtRQUdSLElBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUVyQixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDVixLQUFJLE1BQU0sS0FBSyxJQUFpQixHQUFJLENBQUMsTUFBTSxFQUFFLEVBQUU7Z0JBRTdDLE1BQVksQ0FBQyxFQUFFLENBQUM7YUFFakI7U0FFRjthQUFNO1lBRUwsS0FBSSxNQUFNLEdBQUcsSUFBUyxHQUFHLEVBQUU7Z0JBRXpCLElBQUcsT0FBTyxHQUFHLEtBQUssUUFBUTt1QkFDckIsTUFBTSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFDbkQ7b0JBRUUsTUFBWSxHQUFHLENBQUE7aUJBRWhCO2FBRUY7U0FFRjtJQUVILENBQUM7Q0FFRjtBQW5TRCwrQkFtU0MifQ==