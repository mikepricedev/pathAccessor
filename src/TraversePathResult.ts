import {KeyValueNode} from 'key-nodes';

export default class KeyValueNodeIteratorResult<Tdone extends boolean> {
  
  constructor(readonly done:Tdone,
    readonly value:Tdone extends true ? undefined : KeyValueNode,
    readonly isWildcard:Tdone extends true ? null : boolean)
  {}
  
  // Accessors
  get [Symbol.toStringTag]() {

    return this.constructor.name;

  }

}