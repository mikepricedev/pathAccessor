import PathNotation from 'path-notation';
import { KeyValueNode } from 'key-nodes';
import TraversePathResult from './TraversePathResult';
declare const CREATE_ROOT_KEY: unique symbol;
declare const COULD_NOT_FOLLOW: unique symbol;
declare const KEY_VALUE_NODE_ITERATOR: unique symbol;
declare const FOLLOW_DEPTH: unique symbol;
declare const ITERATOR: unique symbol;
declare const A_ROOT_KEY: unique symbol;
/**
 * [[TraversePath]] is an IterableIterator that iterates the key/values of a
 * object path.
 * @param path Path to traverse in @param doc.
 * @note
 * The @param path accepts wildcard keys `"*"`.  A wildcard key will trigger a
 * breath first traverse of all enumerable object keys and their decedents at
 * that depth.
 */
export default class TraversePath implements Iterator<KeyValueNode, KeyValueNode[], boolean> {
    private readonly [COULD_NOT_FOLLOW];
    private readonly [ITERATOR];
    private [FOLLOW_DEPTH];
    private [A_ROOT_KEY];
    constructor(path: PathNotation | string | number, doc: object | Array<any>);
    readonly followDepth: number;
    /**
     * KeyValueNode breakpoints where wildcard keys had no key literals on doc.
     */
    readonly couldNotFollow: KeyValueNode[];
    readonly [Symbol.toStringTag]: string;
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
    next(follow?: boolean): TraversePathResult<true> | TraversePathResult<false>;
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
    return(): TraversePathResult<true> | TraversePathResult<false>;
    private [KEY_VALUE_NODE_ITERATOR];
    private [CREATE_ROOT_KEY];
    [Symbol.iterator](): TraversePath;
    static keys<TDoc extends object | Array<any>, TKey extends keyof TDoc>(doc: TDoc): IterableIterator<TKey>;
}
export {};
