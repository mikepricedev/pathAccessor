import { KeyValueNode } from 'key-nodes';
/**
 * @note
 * When the done flag is `true`, the value is an Array of KeyValueNode
 * breakpoints where where wildcard keys had no key literals on doc.
 */
export default class TraversePathResult<TDone extends boolean> {
    readonly done: TDone;
    readonly value: TDone extends true ? KeyValueNode[] : KeyValueNode;
    readonly isWildcard: TDone extends true ? null : boolean;
    constructor(done: TDone, value: TDone extends true ? KeyValueNode[] : KeyValueNode, isWildcard: TDone extends true ? null : boolean);
    readonly [Symbol.toStringTag]: string;
}
