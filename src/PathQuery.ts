import PathNotation from 'path-notation';
import {KeyValueNode} from 'key-nodes';
import TraversePath from './TraversePath';

export default class PathQuery {

  // Accessors
  get [Symbol.toStringTag]() {

    return this.constructor.name;

  }

  /**
   * 
   */
  static *getValue<Tvalue = any>(path:string | number | PathNotation,
    doc:object | Array<any>):IterableIterator<Tvalue>
  {

    for(const keyValueNode of this.getKeyValueNodes(path, doc)) {

      yield <Tvalue>keyValueNode.value;

    }
  
  }

  static *setValue<Tvalue = any, Tkey extends string | number = string | number>
    (keyValueNode:KeyValueNode<Tkey, Tvalue>, doc:object | Array<any>)
    : IterableIterator<KeyValueNode<Tkey, Tvalue>>;
  static *setValue<Tvalue = any, Tkey extends string | number = string | number>
    (value:Tvalue, path:string | number | PathNotation, doc:object | Array<any>)
      : IterableIterator<KeyValueNode<Tkey, Tvalue>>;
  static *setValue<Tvalue = any, Tkey extends string | number = string | number>
    (value:Tvalue | KeyValueNode<Tkey, Tvalue>, 
      path:string | number | PathNotation | object | Array<any>,
      doc?:object | Array<any>)
      : IterableIterator<KeyValueNode<Tkey, Tvalue>>
  {

    if(value instanceof KeyValueNode) {

      // NOTE: May or may not be KeyValueNode.isTerminalKey === true
      const terminalKVNode = value;
      doc = <object | Array<any>>path;

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

      yield terminalKVNode;

    } else {
      
      for(const kVNode of this.getKeyValueNodes<Tkey, Tvalue>(<any>path, doc)) 
      {


        const keepHistory = kVNode.keepHistory;

        if(keepHistory === false) {

          kVNode.keepHistory = 1;
          
        } else if(keepHistory !== true) {

          kVNode.keepHistory = keepHistory + 1;

        }

        kVNode.value = value;

        yield* this.setValue(kVNode,doc);

      }

    }

  } 

  static *getKeyValueNodes<Tkey extends string | number = string | number,
    Tvalue = any>(path:string | number | PathNotation, doc:object | Array<any>)
      :IterableIterator<KeyValueNode<Tkey, Tvalue>>
  {
    
    for(const keyValueNode of this.keyValueNodesAlongPath(path, doc)) {

      if(keyValueNode.isTerminalKey) {
        
        yield <KeyValueNode<Tkey, Tvalue>>keyValueNode;
      
      }

    }
  }

  static keyValueNodesAlongPath(path:PathNotation | string | number,
    doc:object | Array<any>):TraversePath
  {

    return new TraversePath(path, doc);

  }

}

