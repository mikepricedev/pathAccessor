import PathNotation from 'path-notation';
import {KeyValueNode} from 'key-nodes';
import TraversePathResult from './TraversePathResult';

const CREATE_ROOT_KEY:unique symbol = Symbol();
const KEY_VALUE_NODE_ITERATOR:unique symbol = Symbol();
const FOLLOW_DEPTH:unique symbol = Symbol();
const ITERATOR:unique symbol = Symbol();
const A_ROOT_KEY:unique symbol = Symbol();
const WILD_CARD_KEY_DEPTHS:unique symbol = Symbol();


enum TraversePathNextArg {
  continue,
  follow,
  return
}


interface IKVNodeIterableIterator
  extends Iterator<[KeyValueNode, boolean],undefined,TraversePathNextArg> 
{
  [Symbol.iterator]():
    Iterator<[KeyValueNode, boolean],undefined,TraversePathNextArg>
}

/**
 * [[TraversePath]] is an IterableIterator that iterates the key/values of a
 * object path.
 * @param path Path to traverse in @param doc.
 * @note
 * The @param path accepts wildcard keys `"*"`.  A wildcard key will trigger a
 * breath first traverse of all enumerable object keys and their decedents at
 * that depth.
 */
export default class TraversePath
  implements Iterator <KeyValueNode, undefined, boolean>
{

  private readonly [ITERATOR]:IKVNodeIterableIterator;
  private [FOLLOW_DEPTH]:number = 0;
  private [A_ROOT_KEY]:KeyValueNode;
  private readonly [WILD_CARD_KEY_DEPTHS] = new Set<number>();

  constructor(path:PathNotation | string | number, doc:object | Array<any>) {

    this[ITERATOR] =
      this[KEY_VALUE_NODE_ITERATOR](doc, new PathNotation(path), 0);

  }
  // Accessors
  get followDepth():number {

    return this[FOLLOW_DEPTH];

  }

  get [Symbol.toStringTag]() {

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
  next(follow = false):
    TraversePathResult<true> |  TraversePathResult<false>
  {

    const result = this[ITERATOR].next(follow ? TraversePathNextArg.follow 
      : TraversePathNextArg.continue);
    
    return result.done === false ? 
      new TraversePathResult(false, result.value[0], result.value[1])
      :
      new TraversePathResult(true, undefined, null);

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
  return():
    TraversePathResult<true> |  TraversePathResult<false>
  {
    
    const result = this[ITERATOR].next(TraversePathNextArg.return);

    return result.done === false ? 
      new TraversePathResult(false, result.value[0], result.value[1])
      :
      new TraversePathResult(true, undefined, null);


  }

  private *[KEY_VALUE_NODE_ITERATOR](doc:object | Array<any>, path:PathNotation,
    depth:number, parentKeyValueNode?:KeyValueNode): IKVNodeIterableIterator
  {

    // End of path
    if(path.length === depth) {
    
      return;
    
    }

    const kVNodeIterationOrder = [{
      depth,
      parentKeyValueNode,
      path,
      value:doc,
      isWildcard:false
    }];

    for(const kVNodeNextResult of kVNodeIterationOrder.values()) {
      
      // Get a local scope copy of path and depth
      let path = kVNodeNextResult.path;
      const depth = kVNodeNextResult.depth;
      
      let key = path[depth];
            
      const docIsObject =  typeof doc === 'object' && doc !== null;

      // Wild card key start breadth first iteration
      if(key === '*' && docIsObject) {

        // Log path depth of wild card key.
        this[WILD_CARD_KEY_DEPTHS].add(depth);

        for(key of 
          <(string | number)[]><any>TraversePath.keys(doc))
        {

          // Escape wildcard key literals
          key = key === "*" ? `\\${key}` : key;

          path = new PathNotation(path);

          // Replace wild card with key literal
          path[depth] = key;

          kVNodeIterationOrder.push({
            ...kVNodeNextResult,
            path,
            isWildcard:true
          });

        }

        continue;

      }
      
      // Unescape wild card key
      key = key === "\\*" ? "*" : key;
      
      const value = docIsObject ? doc[key] : undefined;

      const keyValueNode = depth === 0 ? 
        this[CREATE_ROOT_KEY](key, value)
        : 
        kVNodeNextResult.parentKeyValueNode.addChild(key, value);
      
      const nextResult = yield [keyValueNode, kVNodeNextResult.isWildcard];
      
      const nextDepth = depth + 1;

      // End of path
      if(nextDepth === path.length) {

        continue;

      }

      switch(nextResult) {
        
        case TraversePathNextArg.follow:

          // When follow is called on a non-wild card key, ignore.
          if(this[WILD_CARD_KEY_DEPTHS].has(depth) === false) {
            
            this[FOLLOW_DEPTH]++;
            
            yield* this[KEY_VALUE_NODE_ITERATOR](value, path, nextDepth,
              keyValueNode);
            
            this[FOLLOW_DEPTH]--;
  
            break;
          
          }

        case TraversePathNextArg.continue:
          
          kVNodeIterationOrder.push({
            depth:nextDepth,
            parentKeyValueNode:keyValueNode,
            path,
            value,
            isWildcard:false
          });
          
          break;


        case TraversePathNextArg.return:
          
          return;

      }

    }

  }
  
  private [CREATE_ROOT_KEY](key:string | number, value:object | Array<any>)
    :KeyValueNode 
  {


    if(this[A_ROOT_KEY] === undefined) {

      this[A_ROOT_KEY] = new KeyValueNode(key, value);

      return this[A_ROOT_KEY];

    }

    return this[A_ROOT_KEY].addSibling(key, value);

  }

  [Symbol.iterator](): TraversePath {

    return this;

  }

  // Static methods
  static *keys<Tdoc extends object | Array<any>, Tkey extends keyof Tdoc>(
    doc:Tdoc):IterableIterator<Tkey>
  {

    if(Array.isArray(doc)) {

      let i = 0;
      for(const value of (<Array<any>>doc).values()) {

        yield <Tkey>i++;

      }

    } else {

      for(const key in <any>doc) {

        if(typeof key === 'string' 
          && Object.prototype.hasOwnProperty.call(doc, key))
        {

          yield <Tkey>key

        }

      }

    }

  }

}