import {expect} from 'chai';
import TraversePath from './TraversePath';
import TraversePathResult from './TraversePathResult';
import {KeyValueNode} from 'key-nodes';
import PathNotation from 'path-notation';


describe('TraversePath',()=>{

  describe('Static Methods',()=>{

    describe('keys',()=>{

      it('Returns an iterable iterator of enumerable object keys.',()=>{

        const obj = {
          foo:Symbol(),
          bar:Symbol(),
          baz:Symbol()
        };

        expect(Array.from(TraversePath.keys(obj)))
          .to.have.members(Object.keys(obj));

      });

      it('Returns an iterable iterator of Array indexes.',()=>{

        const arr = [Symbol(),Symbol(),Symbol()];

        const indexIter = TraversePath.keys(arr);
        let indexResult = indexIter.next();

        let i = 0;
        while(i < arr.length && !indexResult.done) {

          expect(indexResult.value).to.equal(i++);
          indexResult = indexIter.next();

        }

        expect(i).to.equal(arr.length);


      });

    });

    describe('Instantiation',()=>{

      it(`Instantiates an IterableIterator of KeyValueNodes.`,()=>{

        const doc = {
          foo:{
            bar:[{baz:Symbol()}]
          }
        };

        const path = "foo.bar[0].baz";

        const traversePath = new TraversePath(path, doc);

        let i = 0;
        for(const keyValueNode of traversePath) {

          expect(keyValueNode).to.be.instanceOf(KeyValueNode);

          i++;

        } 

        expect(i).to.be.greaterThan(0);

      });

      it('Iterates the KeyValueNodes depth first along a path',()=>{

        const doc = {
          foo:{
            bar:[{baz:Symbol()}]
          }
        };

        const path = "foo.bar[0].baz";

        const traversePath = new TraversePath(path, doc);

        let keyValResult = traversePath.next();
        expect(keyValResult.value).property('key').to.equal('foo');
        expect(keyValResult.value).property('value').to.equal(doc.foo);
        
        keyValResult = traversePath.next();
        expect(keyValResult.value).property('key').to.equal('bar');
        expect(keyValResult.value).property('value').to.equal(doc.foo.bar);

        keyValResult = traversePath.next();
        expect(keyValResult.value).property('key').to.equal(0);
        expect(keyValResult.value).property('value').to.equal(doc.foo.bar[0]);

        keyValResult = traversePath.next();
        expect(keyValResult.value).property('key').to.equal('baz');
        expect(keyValResult.value).property('value')
          .to.equal(doc.foo.bar[0].baz);

        expect(traversePath.next()).property('done').to.be.true;

      });

      it('Iterates breadth first when a wildcard key "*" is passed.',()=> {

        const doc = {
          foo:{
            bar1:[{baz:Symbol()}],
            bar2:[{baz:Symbol()}],
            bar3:[{baz:Symbol()}],
          }
        };

        const path = "foo[*][0].baz";

        const traversePath = new TraversePath(path, doc);

        let keyValResult = traversePath.next();
        expect(keyValResult.value).property('key').to.equal('foo');
        expect(keyValResult.value).property('value').to.equal(doc.foo);

        keyValResult = traversePath.next();
        expect(keyValResult.value).property('key').to.equal('bar1');
        expect(keyValResult.value).property('value').to.equal(doc.foo.bar1);

        keyValResult = traversePath.next();
        expect(keyValResult.value).property('key').to.equal('bar2');
        expect(keyValResult.value).property('value').to.equal(doc.foo.bar2);        
        
        keyValResult = traversePath.next();
        expect(keyValResult.value).property('key').to.equal('bar3');
        expect(keyValResult.value).property('value').to.equal(doc.foo.bar3); 
        
        keyValResult = traversePath.next();
        expect(keyValResult.value).property('key').to.equal(0);
        expect(keyValResult.value).property('value').to.equal(doc.foo.bar1[0]);
        
        keyValResult = traversePath.next();
        expect(keyValResult.value).property('key').to.equal(0);
        expect(keyValResult.value).property('value').to.equal(doc.foo.bar2[0]);

        keyValResult = traversePath.next();
        expect(keyValResult.value).property('key').to.equal(0);
        expect(keyValResult.value).property('value').to.equal(doc.foo.bar3[0]);

        keyValResult = traversePath.next();
        expect(keyValResult.value).property('key').to.equal('baz');
        expect(keyValResult.value).property('value')
          .to.equal(doc.foo.bar1[0].baz);
        
        keyValResult = traversePath.next();
        expect(keyValResult.value).property('key').to.equal('baz');
        expect(keyValResult.value).property('value')
          .to.equal(doc.foo.bar2[0].baz);
        
        keyValResult = traversePath.next();
        expect(keyValResult.value).property('key').to.equal('baz');
        expect(keyValResult.value).property('value')
          .to.equal(doc.foo.bar3[0].baz);

        expect(traversePath.next()).property('done').to.be.true;

      });

      it('Updates wildcard keys with key literal in path.',()=>{

        const doc = {
          foo:{
            bar1:[{baz:Symbol()}],
            bar2:[{baz:Symbol()}],
            bar3:[{baz:Symbol()}],
          }
        };

        const path = "foo[*][0].baz";

        const terminalKeys:KeyValueNode[] = [];
        for(const keyValNode of [...new TraversePath(path, doc)]) {

          if(keyValNode.isTerminalKey) {

            terminalKeys.push(keyValNode);

          }

        }

        terminalKeys[0].path
        expect(terminalKeys[0].path.toString()).to.equal("foo.bar1[0].baz");
        expect(terminalKeys[1].path.toString()).to.equal("foo.bar2[0].baz");
        expect(terminalKeys[2].path.toString()).to.equal("foo.bar3[0].baz");


      });

      it(`Escapes wildcard key "*" with double backslashes "\\\\*".`,() =>{

        const doc = {
          foo:{
            "*":[{baz:Symbol()}]
          }
        };

        const path = "foo.\\*[0].baz";

        const traversePath = new TraversePath(path, doc);

        let keyValResult = traversePath.next();
        expect(keyValResult.value).property('key').to.equal('foo');
        expect(keyValResult.value).property('value').to.equal(doc.foo);

        keyValResult = traversePath.next();
        expect(keyValResult.value).property('key').to.equal('*');
        expect(keyValResult.value).property('value').to.equal(doc.foo["*"]);

      });

      it(`Iterates values undefined when an ancestor was undefined or not an
          object.`,()=>
      {

        const doc = {
          foo:{}
        };

        const path = "foo.bar[0].baz";

        const traversePath = new TraversePath(path, doc);

        let keyValResult = traversePath.next();
        expect(keyValResult.value).property('key').to.equal('foo');
        expect(keyValResult.value).property('value').to.equal(doc.foo);
        
        keyValResult = traversePath.next();
        expect(keyValResult.value).property('key').to.equal('bar');
        expect(keyValResult.value).property('value').to.be.undefined;

        keyValResult = traversePath.next();
        expect(keyValResult.value).property('key').to.equal(0);
        expect(keyValResult.value).property('value').to.be.undefined;

        keyValResult = traversePath.next();
        expect(keyValResult.value).property('key').to.equal('baz');
        expect(keyValResult.value).property('value')
          .to.be.undefined;

        expect(traversePath.next()).property('done').to.be.true;

      });

      it(`Stops iteration when wildcard key has no key literals defined.`,
        ()=>
      {

        const doc = {
          foo:{}
        };

        const path = "foo[*][0].baz"

        const traversePath = new TraversePath(path, doc);

        let keyValResult = traversePath.next();
        expect(keyValResult.value).property('key').to.equal('foo');
        expect(keyValResult.value).property('value').to.equal(doc.foo);
        
        expect(traversePath.next()).property('done').to.be.true;
        
      });

      it(`Returns an Array of KeyValueNodes where wildcard key has no key
          literals defined do to non-object or null values.`,()=>
      {

        const doc = [
          {foo:[{baz:Symbol()}]},
          {foo:null},
          {foo:[{baz:Symbol()}]},
          {foo:12},
          {foo:[{baz:Symbol()}]},
        ]

        const path = new PathNotation("[*]foo[*].baz");
        const depth = path.length - 1;

        const traversePath = new TraversePath(path, doc);

        let resultValues = [];
        let keyValResult = traversePath.next();
        while(keyValResult.done === false) {

          if(keyValResult.value.depth === depth) {
            resultValues.push(keyValResult.value);
          }

          keyValResult = traversePath.next();
        
        }
        
        expect(resultValues).to.have.lengthOf(3);

        expect(resultValues[0].value).to.equal(doc[0].foo[0].baz);
        expect(resultValues[1].value).to.equal(doc[2].foo[0].baz);
        expect(resultValues[2].value).to.equal(doc[4].foo[0].baz);

        const couldNotFollow = keyValResult.value;
        
        expect(couldNotFollow).to.have.lengthOf(2);

        expect(couldNotFollow[0].value).to.equal(doc[1].foo);
        expect(couldNotFollow[1].value).to.equal(doc[3].foo);

      });

      it(`Returns an Array of KeyValueNodes where wildcard key has no key
          literals defined do to empty objects.`,()=>
      {

        const doc = {foo:[]};

        const path = new PathNotation("foo[*].baz");
        const depth = path.length - 1;

        const traversePath = new TraversePath(path, doc);

        while(traversePath.next().done === false);

        const couldNotFollow = traversePath.next().value;
        
        expect(couldNotFollow).to.have.lengthOf(1);

        expect(couldNotFollow[0].value).to.equal(doc.foo);

      });

    });

    describe('Accessors',()=>{

      describe('followDepth', ()=>{

        it(`Tracks the number of nested wildcard key paths currently being
            followed.`,()=>
        {

          const doc = {
            foo:{
              bar1:[{baz:[Symbol()]},{baz:[Symbol()]},{baz:[Symbol()]}],
              bar2:[{baz:[Symbol()]},{baz:[Symbol()]},{baz:[Symbol()]}],
              bar3:[{baz:[Symbol()]},{baz:[Symbol()]},{baz:[Symbol()]}],
            }
          };
  
          const path = "foo[*][*].baz";

          const traversePath = new TraversePath(path, doc);

          let keyValResult = traversePath.next(); // foo
          keyValResult = traversePath.next(); // bar1
          keyValResult = traversePath.next(); // bar2
          
          expect(traversePath.followDepth).to.equal(0);
          
          keyValResult = traversePath.next(true); // bar2[0]
          keyValResult = traversePath.next(); // bar2[1]
          
          expect(traversePath.followDepth).to.equal(1);


          keyValResult = traversePath.next(true); // bar2[1].baz;

          expect(traversePath.followDepth).to.equal(2);

          keyValResult = traversePath.next(); // bar2[2];
          
          expect(traversePath.followDepth).to.equal(1);

          keyValResult = traversePath.next(); // bar2[0].baz;
          keyValResult = traversePath.next(); // bar2[2].baz;
          
          keyValResult = traversePath.next(); // bar2;

          expect(traversePath.followDepth).to.equal(0);

        });

      });

    });

    describe('Methods',()=>{

      describe('next',()=>{

        it(`Returns a TraversePathResult.`,()=>{

          const doc = {
            foo:{
              bar:[{baz:Symbol()}]
            }
          };
  
          const path = "foo.bar[0].baz";
  
          const traversePath = new TraversePath(path, doc);

          const result = traversePath.next();

          expect(result).to.be.instanceOf(TraversePathResult);

        });

        it(`Follows a depth first traverse of a wildcard key when true is 
            passed.`,()=>
        {

          const doc = {
            foo:{
              bar1:[{baz:Symbol()}],
              bar2:[{baz:Symbol()}],
              bar3:[{baz:Symbol()}],
            }
          };
  
          const path = "foo[*][0].baz";
  
          const traversePath = new TraversePath(path, doc);

          let keyValResult = traversePath.next(); // foo
          keyValResult = traversePath.next(); // bar 1
          keyValResult = traversePath.next(); // bar 2

          keyValResult = traversePath.next(true); // follow bar 2
          expect(keyValResult.value).property('key').to.equal(0);
          expect(keyValResult.value).property('value')
            .to.equal(doc.foo.bar2[0]);

          keyValResult = traversePath.next();
          expect(keyValResult.value).property('key').to.equal('baz');
          expect(keyValResult.value).property('value')
            .to.equal(doc.foo.bar2[0].baz);


        });

        it(`Continues breadth first traverse after depth first traverse of 
            wildcard key is complete.  Excludes the keys traversed during the
            depth first traverse.`, ()=>
        {

          const doc = {
            foo:{
              bar1:[{baz:Symbol()}],
              bar2:[{baz:Symbol()}],
              bar3:[{baz:Symbol()}],
            }
          };
  
          const path = "foo[*][0].baz";
  
          const traversePath = new TraversePath(path, doc);

          let keyValResult = traversePath.next(); // foo
          keyValResult = traversePath.next(); // bar1
          keyValResult = traversePath.next(); // bar2
          keyValResult = traversePath.next(true); // bar2[0]
          keyValResult = traversePath.next(); // bar2[0].baz

          keyValResult = traversePath.next();
          expect(keyValResult.value).property('key').to.equal('bar3');
          expect(keyValResult.value).property('value').to.equal(doc.foo.bar3); 
          
          keyValResult = traversePath.next();
          expect(keyValResult.value).property('key').to.equal(0);
          expect(keyValResult.value).property('value').to.equal(doc.foo.bar1[0]);

          keyValResult = traversePath.next();
          expect(keyValResult.value).property('key').to.equal(0);
          expect(keyValResult.value).property('value').to.equal(doc.foo.bar3[0]);

          keyValResult = traversePath.next();
          expect(keyValResult.value).property('key').to.equal('baz');
          expect(keyValResult.value).property('value')
            .to.equal(doc.foo.bar1[0].baz);

          keyValResult = traversePath.next();
          expect(keyValResult.value).property('key').to.equal('baz');
          expect(keyValResult.value).property('value')
            .to.equal(doc.foo.bar3[0].baz);

          expect(traversePath.next()).property('done').to.be.true;

        });

        it(`Marks TraversePathResult.isWildcard true when key is wildcard.`,
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
  
          const traversePath = new TraversePath(path, doc);
          
          const wildcardKeys:KeyValueNode[] = [];

          let traversePathResult = traversePath.next();
          while(traversePathResult.done === false) {


            if(traversePathResult.isWildcard) {
  
              wildcardKeys.push(traversePathResult.value);
              
            }

            traversePathResult = traversePath.next()
            
          }

          expect(wildcardKeys[0].key).to.equal('bar1');
          expect(wildcardKeys[1].key).to.equal('bar2');
          expect(wildcardKeys[2].key).to.equal('bar3');

        
        });

      });

      describe('return', ()=>{

        it(`Exits iteration with done flag true when TraversePath.depth is 0.`,
          ()=>
        {

          const doc = {
            foo:{
              bar:[{baz:Symbol()}]
            }
          };
  
          const path = "foo.bar[0].baz";
  
          const traversePath = new TraversePath(path, doc);

          let keyValResult = traversePath.next();
          keyValResult = traversePath.next();
          
          expect(traversePath.followDepth).to.equal(0);

          keyValResult = traversePath.return();
          
          expect(keyValResult).property('done').to.be.true;

        });

        it(`Exits depth first traverse of wildcard key and continues breadth
            first traverse.  Excludes the keys traversed and their decedents
            from the exited depth first traverse.`,()=>
        {

          const doc = {
            foo:{
              bar1:[{baz:Symbol()}],
              bar2:[{baz:Symbol()}],
              bar3:[{baz:Symbol()}],
            }
          };
  
          const path = "foo[*][0].baz";
  
          const traversePath = new TraversePath(path, doc);

          let keyValResult = traversePath.next(); // foo
          keyValResult = traversePath.next(); // bar 1
          keyValResult = traversePath.next(); // bar 2

          keyValResult = traversePath.next(true); // follow bar 2
          expect(keyValResult.value).property('key').to.equal(0);
          expect(keyValResult.value).property('value')
            .to.equal(doc.foo.bar2[0]);
          expect(traversePath).property('followDepth').to.equal(1);

          keyValResult = traversePath.return();
          expect(keyValResult.value).property('key').to.equal('bar3');
          expect(keyValResult.value).property('value').to.equal(doc.foo.bar3); 
          expect(traversePath).property('followDepth').to.equal(0);

          keyValResult = traversePath.next();
          expect(keyValResult.value).property('key').to.equal(0);
          expect(keyValResult.value).property('value').to.equal(doc.foo.bar1[0]);

          keyValResult = traversePath.next();
          expect(keyValResult.value).property('key').to.equal(0);
          expect(keyValResult.value).property('value').to.equal(doc.foo.bar3[0]);

          keyValResult = traversePath.next();
          expect(keyValResult.value).property('key').to.equal('baz');
          expect(keyValResult.value).property('value')
            .to.equal(doc.foo.bar1[0].baz);

          keyValResult = traversePath.next();
          expect(keyValResult.value).property('key').to.equal('baz');
          expect(keyValResult.value).property('value')
            .to.equal(doc.foo.bar3[0].baz);

          expect(traversePath.next()).property('done').to.be.true;
          

        });

        it(`Exists 1 level of depth first nested traverses per call.`,()=>{

          const doc = {
            foo1:{
              bar1:[{baz:Symbol()}],
              bar2:[{baz:Symbol()}],
              bar3:[{baz:Symbol()}],
            },
            foo2:{
              bar1:[{baz:Symbol()}],
              bar2:[{baz:Symbol()}],
              bar3:[{baz:Symbol()}],
            },
            foo3:{
              bar1:[{baz:Symbol()}],
              bar2:[{baz:Symbol()}],
              bar3:[{baz:Symbol()}],
            }
          };

          const path = '[*][*][0].baz';

          const traversePath = new TraversePath(path, doc);

          let keyValResult = traversePath.next(); // foo1
          keyValResult = traversePath.next(); // foo2
          keyValResult = traversePath.next(true); //foo2.bar1
          keyValResult = traversePath.next(); // foo2.bar2
          keyValResult = traversePath.next(true); //foo2.bar2[0]

          expect(traversePath).property('followDepth').to.equal(2);
          
          keyValResult = traversePath.return(); // foo2.bar3
          expect((<any>keyValResult.value).value).to.equal(doc.foo2.bar3);
          expect(traversePath).property('followDepth').to.equal(1);

          keyValResult = traversePath.return(); // foo3
          expect((<any>keyValResult.value).value).to.equal(doc.foo3);
          expect(traversePath).property('followDepth').to.equal(0);


        });

      });

    });

  });

});