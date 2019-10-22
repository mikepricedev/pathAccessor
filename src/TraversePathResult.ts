import {KeyValueNode} from 'key-nodes';

/**
 * @note
 * When the done flag is `true`, the value is an Array of KeyValueNode
 * breakpoints where where wildcard keys had no key literals on doc.
 */
export default class KeyValueNodeIteratorResult<Tdone extends boolean> {
  
  constructor(readonly done:Tdone,
    readonly value:Tdone extends true ? KeyValueNode[] : KeyValueNode,
    readonly isWildcard:Tdone extends true ? null : boolean)
  {}
  
  // Accessors
  get [Symbol.toStringTag]() {

    return this.constructor.name;

  }

}