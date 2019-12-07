import PathNotation from 'path-notation';
import {KeyValueNode} from 'key-nodes';
import TraversePath from './TraversePath';
import TraversePathResult from './TraversePathResult';

interface ReturnIterableIterator<T, TReturn, TNext = undefined> 
  extends Iterator<T, TReturn, TNext> 
{
  [Symbol.iterator](): ReturnIterableIterator<T, TReturn, TNext>;
}

const PATH:unique symbol = Symbol();

export default class PathAccessor<TValue = any,
  TKey extends string | number = string | number,
  TDoc extends object | Array<any> = object | Array<any>> 
{

  private readonly [PATH]:PathNotation;

  constructor(path:string | number | PathNotation){

    this[PATH] = new PathNotation(path);

  }

  set(doc:TDoc, value?:TValue) {

    return PathAccessor.set<TValue, TKey>(this[PATH], doc, value);

  }

  get(doc:TDoc) {

    return PathAccessor.get<TValue, TKey>(this[PATH], doc);

  }

  getValue(doc:TDoc) {

    return PathAccessor.getValue<TValue>(this[PATH], doc);

  }

  // Accessors
  get [Symbol.toStringTag]() {

    return this.constructor.name;

  }

  static set<TValue = any, TKey extends string | number = string | number>
    (keyValueNode:KeyValueNode<TKey, TValue>, doc:object | Array<any>)
      :ReturnIterableIterator<KeyValueNode<TKey, TValue>, KeyValueNode[]>;
  static set<TValue = any, TKey extends string | number = string | number>
    (path:string | number | PathNotation, doc:object | Array<any>, value:TValue)
      :ReturnIterableIterator<KeyValueNode<TKey, TValue>, KeyValueNode[]>
  static *set<TValue = any, TKey extends string | number = string | number>
    (path:string | number | PathNotation | KeyValueNode<TKey, TValue>,
      doc:object | Array<any>, value?:TValue)
        :ReturnIterableIterator<KeyValueNode<TKey, TValue>, KeyValueNode[]>
  {

    if(path instanceof KeyValueNode) {

      // NOTE: May or may not be KeyValueNode.isTerminalKey === true
      const terminalKVNode = path;

      yield terminalKVNode;

      const kVNodeIter = terminalKVNode.pathToKey(true);
      let kVNodeIterResult = kVNodeIter.next();
      let childKVNodeResult = kVNodeIter.next();

      while(kVNodeIterResult.value !== terminalKVNode) {

        const key = kVNodeIterResult.value.key;

        if(!(key in doc) || typeof doc[key] !== 'object' || doc[key] === null) {

          doc[key] = (<KeyValueNode>childKVNodeResult.value).keyType === 'index'
            ? [] : {}; 

        }

        doc = doc[key];
        kVNodeIterResult = childKVNodeResult;
        childKVNodeResult = kVNodeIter.next();

      }
      
      doc[<string | number>terminalKVNode.key] = terminalKVNode.value;

      return [];
    
    } else {
      
      const getIter = this.get<TValue, TKey>(<any>path, doc);
      let getIterResult:IteratorResult<KeyValueNode<TKey, TValue>,
        KeyValueNode[]>;
      while(!(getIterResult = getIter.next()).done) {

        const kVNode = <KeyValueNode<TKey, TValue>>getIterResult.value;

        const keepHistory = kVNode.keepHistory;
  
        if(keepHistory === false) {
  
          kVNode.keepHistory = 1;
          
        } else if(keepHistory !== true) {
  
          kVNode.keepHistory = keepHistory + 1;
  
        }
        
        kVNode.value = value;

        yield* this.set(kVNode,doc);
      
      }

      return <KeyValueNode[]>getIterResult.value;

    }

  }

  static *get<TValue = any,TKey extends string | number = string | number>(
    path:string | number | PathNotation, doc:object | Array<any>)
      :ReturnIterableIterator<KeyValueNode<TKey, TValue>, KeyValueNode[]>
  {
    
    const pathNotation = new PathNotation(path);
    const depth = pathNotation.length - 1;

    const tPIter = new TraversePath(pathNotation, doc);
    let tpNextResult:TraversePathResult<true | false>;  
    while(!(tpNextResult = tPIter.next()).done) {

      const kVNode = <KeyValueNode>tpNextResult.value; 

      if(kVNode.depth === depth) {
        
        yield <KeyValueNode<TKey, TValue>>kVNode;
      
      }

    }

    return <KeyValueNode[]>tpNextResult.value;
  
  }

  /**
   * Convenience method that yields the values instead of the KeyValueNodes.
   */
  static *getValue<TValue = any>(path:string | number | PathNotation,
    doc:object | Array<any>, defaultValue?:TValue):IterableIterator<TValue>
  {
    
    const hasDefault = defaultValue !== undefined;

    const getIter = this.get(path, doc);
    let getNextResult:IteratorResult<KeyValueNode<string | number,
      TValue>, KeyValueNode[]>;
    
    let numYield = 0;

    while(!(getNextResult = getIter.next()).done) {

      const keyValueNode = 
        <KeyValueNode<string | number, TValue>>getNextResult.value;

      if(keyValueNode.value === undefined && hasDefault) {

        yield defaultValue;
        numYield++;
        continue;

      }

      yield <TValue>keyValueNode.value;
      numYield++;

    }

    const doneValue = <KeyValueNode<string | number, any,
      KeyValueNode<string | number, any, any>>[]>getNextResult.value;

    if(doneValue.length > 0 && hasDefault && numYield === 0) {
      
      yield defaultValue;

    }
  
  }

}