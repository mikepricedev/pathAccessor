import {expect} from 'chai';
import PathQuery from './PathAccessor';
import PathNotation from 'path-notation';
import { KeyValueNode } from 'key-nodes';

describe('PathQuery',()=>{

  describe('Static Methods',()=>{

    describe('get',()=>{

      it(`Returns IterableIterator of terminal KeyValueNodes at a path in a
          doc.`,()=>
      {

        const doc = {
          foo:{
            bar:[{baz:Symbol()}]
          }
        };

        const path = "foo.bar[0].baz";
  
        const terminalKeyIter = PathQuery.get(path, doc);

        const result = terminalKeyIter.next();
        const keyValueNode = result.value;

        expect(keyValueNode).property('key').to.equal('baz');
        expect(keyValueNode)
          .property('value')
          .to.equal(doc.foo.bar[0].baz);

        expect(terminalKeyIter.next()).property('done').to.be.true;

      });

      it(`Immediately returns done flag true when wildcard key is used and
          no key literals are defined at the wildcard key.`, ()=>
      {

        const doc = {
          foo:{}
        };

        const path = "foo[*][0].baz";
  
        const terminalKeyIter = PathQuery.get(path, doc);

        expect(terminalKeyIter.next()).property('done').to.be.true;

      });

      it(`Returns an Array of KeyValueNodes where wildcard key has no key
          literals defined do to non-object or null values.`,()=>
      {

        const doc = {foo:[]};

        const path = new PathNotation("foo[*].baz");

        const getPath = PathQuery.get(path, doc);

        let couldNotgetResult = getPath.next();
        while(!couldNotgetResult.done) {
          couldNotgetResult = getPath.next();
        };

        const couldNotget = couldNotgetResult.value;
        
        expect(couldNotget).to.have.lengthOf(1);

        expect(couldNotget[0].value).to.equal(doc.foo);

      });

    });

    describe('getValue',()=>{

      it(`Returns IterableIterator of terminal values at a path in a
          doc.`,()=>
      {

        const doc = {
          foo:{
            bar:[{baz:Symbol()}]
          }
        };

        const path = "foo.bar[0].baz";
  
        const terminalKeyIter = PathQuery.getValue(path, doc);

        const result = terminalKeyIter.next();
        const value = result.value;

        expect(value)
          .to.equal(doc.foo.bar[0].baz);

        expect(terminalKeyIter.next()).property('done').to.be.true;

      });
      
      it(`Iterates all values at path depth when wildcard key "*" is defined in
          path.`,
        ()=>
      {

        const doc = {
          foo:{
            bar1:[{baz:Symbol()}],
            bar2:[{baz:Symbol()}],
            bar3:[{baz:Symbol()}],
          }
        };

        const path = "foo[*][0].baz";
  
        const terminalKeyIter = PathQuery.getValue(path, doc);

        let value = terminalKeyIter.next().value;

        expect(value)
          .to.equal(doc.foo.bar1[0].baz);

        value = terminalKeyIter.next().value;

        expect(value)
          .to.equal(doc.foo.bar2[0].baz);
        
          value = terminalKeyIter.next().value;

        expect(value)
          .to.equal(doc.foo.bar3[0].baz);

        expect(terminalKeyIter.next()).property('done').to.be.true;

      });

      it(`Returns undefined when path is not defined on doc.`,()=>{

        const doc = {
          foo:{}
        };

        const path = "foo.bar[0].baz";
  
        const terminalKeyIter = PathQuery.getValue(path, doc);

        const result = terminalKeyIter.next();
        const value = result.value;

        expect(value)
          .to.be.undefined;

        expect(terminalKeyIter.next()).property('done').to.be.true;

      });

      it(`Immediately returns done flag true when wildcard key is used and
          no key literals are defined at the wildcard key.`, ()=>
      {

        const doc = {
          foo:{}
        };

        const path = "foo[*][0].baz";
  
        const terminalKeyIter = PathQuery.getValue(path, doc);

        expect(terminalKeyIter.next()).property('done').to.be.true;

      });

    });

    describe('set',()=>{

      it('Returns an IterableIterator of KeyValueNodes to set on doc.',()=>{

          const doc = {
            foo:{
              bar:[{baz:Symbol()}]
            }
          };

          const path = "foo.bar[0].baz";

          const value = Symbol();

          const iter = PathQuery.set(path, doc, value);
          const {value:keyValNode} = iter.next();

          expect((<KeyValueNode>keyValNode).path.toString()).to.equal(path);

      });

      it('Sets the value of the previous KeyValueNode after calling next.',()=>{

        const doc = {
          foo:{
            bar:[{baz:Symbol()}]
          }
        };

        const path = "foo.bar[0].baz";

        const value = Symbol();

        const iter = PathQuery.set(path, doc, value);
        
        let result = iter.next();
        expect(doc.foo.bar[0].baz).to.not.equal(value);

        (<KeyValueNode>result.value).value = value;
        
        iter.next();
        expect(doc.foo.bar[0].baz).to.equal(value);

      });

      it(`Iterates through all end points when wildcard key "*" is defined in
          path.`,()=>
      {

        const doc = {
          foo:{
            bar1:[{baz:Symbol()}],
            bar2:[{baz:Symbol()}],
            bar3:[{baz:Symbol()}],
          }
        };

        const sets:symbol[] = [];

        const path = "foo[*][0].baz";

        const iter = PathQuery.set(path, doc, undefined);

        for(const kVNode of iter) {

          kVNode.value = Symbol();
          sets.push(kVNode.value);

        }

        expect(doc.foo.bar1[0].baz).to.equal(sets[0]);
        expect(doc.foo.bar2[0].baz).to.equal(sets[1]);
        expect(doc.foo.bar3[0].baz).to.equal(sets[2]);

      });

    });

  });

});