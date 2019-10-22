import PathNotation from 'path-notation';
import {KeyValueNode} from 'key-nodes';
import TraversePath from './TraversePath';

export default class PathQuery {

  // Accessors
  get [Symbol.toStringTag]() {

    return this.constructor.name;

  }

  static *read<Tvalue = any,Tkey extends string | number = string | number>(
    path:string | number | PathNotation, doc:object | Array<any>)
      :IterableIterator<KeyValueNode<Tkey, Tvalue>>
  {
    
    const pathNotation = new PathNotation(path);
    const depth = pathNotation.length - 1;

    for(const keyValueNode of new TraversePath(pathNotation, doc)) {

      if(keyValueNode.depth === depth) {
        
        yield <KeyValueNode<Tkey, Tvalue>>keyValueNode;
      
      }

    }
  
  }

  /**
   * Convenience method that yields the values instead of the KeyValueNodes.
   */
  static *readValue<Tvalue = any>(path:string | number | PathNotation,
    doc:object | Array<any>):IterableIterator<Tvalue>
  {
    for(const keyValueNode of this.read(path, doc)) {

      yield <Tvalue>keyValueNode.value;

    }
  
  }

  static *update<Tvalue = any, Tkey extends string | number = string | number>
    (path:string | number | PathNotation | KeyValueNode<Tkey, Tvalue>,
      doc:object | Array<any>): IterableIterator<KeyValueNode<Tkey, Tvalue>>
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
    
    } else {
      
      for(const kVNode of this.read<Tvalue, Tkey>(<any>path, doc)) 
      {

        const keepHistory = kVNode.keepHistory;

        if(keepHistory === false) {

          kVNode.keepHistory = 1;
          
        } else if(keepHistory !== true) {

          kVNode.keepHistory = keepHistory + 1;

        }
        
        yield* this.update(kVNode,doc);

      }

    }

  } 

  static *delete<Tvalue = any, Tkey extends string | number = string | number>
    (path:string | number | PathNotation | KeyValueNode<Tkey, Tvalue>,
      doc:object | Array<any>): IterableIterator<KeyValueNode<Tkey, Tvalue>>
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

        // Value DNE on path. No need to delete, return
        if(!(key in doc) || typeof doc[key] !== 'object' || doc[key] === null) {

          return;

        }

        doc = doc[key];
        kVNodeIterResult = childKVNodeResult;
        childKVNodeResult = kVNodeIter.next();

      }
      
      delete doc[<string | number>terminalKVNode.key];

    } else {

      for(const kVNode of this.read<Tvalue, Tkey>(path,doc)) {

        const keepHistory = kVNode.keepHistory;

        if(keepHistory === false) {

          kVNode.keepHistory = 1;
          
        } else if(keepHistory !== true) {

          kVNode.keepHistory = keepHistory + 1;

        }

        yield* this.delete(kVNode,doc);

      };

    }    

  }

}

