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
  static *get<Tvalue = any>(path:string | number | PathNotation,
    doc:object | Array<any>):IterableIterator<Tvalue>
  {

    for(const keyValueNode of this.getKeyValueNodes(path, doc)) {

      yield <Tvalue>keyValueNode.value;

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

