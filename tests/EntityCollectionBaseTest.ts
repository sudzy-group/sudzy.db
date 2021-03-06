import { subscribeToResult } from 'rxjs/util/subscribeToResult';
import * as PouchDB from 'pouchdb';
import { suite, test, slow, timeout, skip, only } from "mocha-typescript";
import { EntityCollectionBase } from '../src/EntityCollectionBase';
import * as _ from 'lodash'
import { Promise } from 'ts-promise';

@suite class EntityCollectionBaseTest {

    static db_name : string;
    static db: PouchDB;

    static before() {
        EntityCollectionBaseTest.db_name = 'TestEntityCollectionBase' + Math.random();
        EntityCollectionBaseTest.db = new PouchDB(EntityCollectionBaseTest.db_name);
    }

    static after(done) {
        EntityCollectionBaseTest.db.destroy().then(() => {
            done();
        }).catch(function (err) {
          console.log(err);
        });
    }

    @test ("insert doc should return entity")
    testInsertDoc(done: Function) {
        let collection = new EntityCollectionBase("post", EntityCollectionBaseTest.db);
        collection.insert({ a: "b" }).then((d) => {
            if (d.core.a != "b") {
                throw new Error("missing field a");
            }
            return done();
        }).catch(_.noop);
    }

    @test ("decorators without store should fail")
    testDeocratorWithoutType(done: Function) {
        let collection = new EntityCollectionBase("post", EntityCollectionBaseTest.db);
        collection.insert({ a: "b" }, [{ c : "c" }], ['a', 'b']).then(_.noop).catch(() => {
            return done();
        });
    }

    @test ("basic insert")
    testInsertBasic1(done: Function) {
        let collection = new EntityCollectionBase("post", EntityCollectionBaseTest.db);
        collection.insert({ a: "b" }, [ { store: 'c', c: "c"}], [{ key : 'a', val : 'b' }]).then((d) => {
            return done();
        }).catch(_.noop);
    }

    @test ("basic insert check ref")
    testInsertBasic2(done: Function) {
        let collection = new EntityCollectionBase("post", EntityCollectionBaseTest.db);
        collection.insert({ a: "b" }, [ { store: 'c', c: "c"}], [{ key : 'a', val : 'b' }]).then((d) => {
            let ref = "post/a/b/" + d.core.index;
            if (d.search_keys_ref['a/b'].ref != ref) {
                throw new Error("missing ref");
            }
            return EntityCollectionBaseTest.db.get(ref);
        }).then((d) => {
            return done();
        }).catch(_.noop);
    }

    @test ("basic insert and get")
    testInsertBasic3(done: Function) {
        let collection = new EntityCollectionBase("post", EntityCollectionBaseTest.db);
        collection.insert({ a: "b" }, [ { store: 'c', c: "c"}], [{ key : 'a', val : 'b' }]).then((d) => {
            let id = d.core.index;
            return collection.getById(id);
        }).then((d) => {
            if (!d.core._id) {
                throw new Error("missing core doc");
            }
            return done();
        }).catch(_.noop);
    }

    @test ("missing get should fail")
    testMissingGet(done: Function) {
        let collection = new EntityCollectionBase("post", EntityCollectionBaseTest.db);
        collection.getById("missing-id").then(_.noop).catch(() => done());
    }

    @test ("basic insert, remove and get")
    testInsertBasicRemove(done: Function) {
        let collection = new EntityCollectionBase("post", EntityCollectionBaseTest.db);
        collection.insert({ a: "b" }, [ { store: 'c', c: "c"}], [{ key : 'a', val : 'b' }]).then((d) => {
            let id = d.core.index;
            return collection.getById(id);
        }).then((e) => {
            if (!e.core._id) {
                throw new Error("missing core doc");
            }
            return collection.remove(e);
        }).then((e) => {
            let id = e.core.index;
            return collection.getById(id);
        }).then(_.noop).catch(() => done())
    }

    @test ("basic insert, remove without search keys")
    testInsertBasicRemoveNoSearchKeys(done: Function) {
        let collection = new EntityCollectionBase("post", EntityCollectionBaseTest.db);
        collection.insert({ a: "b" }, [ { store: 'c', c: "c"}], undefined).then((e) => {
            return collection.getById(e.getId());
        }).then((e) => {
            if (!e.core._id) {
                throw new Error("missing core doc");
            }
            return collection.remove(e);
        }).then((e) => {
            let id = e.core.index;
            return collection.getById(id);
        }).then(_.noop).catch(() => done())
    }    

    @test ("basic insert and find")
    testInsertAndFind(done: Function) {
        let collection = new EntityCollectionBase("post", EntityCollectionBaseTest.db);
        collection.insert({ a: "b" }, [ { store: 'c', c: "c"}], [{ key : 'a', val : 'special' }]).then((d) => {
            let id = d.core.index;
            return collection.findByKey('a', 'special');
        }).then((d) => {
            if (d.length != 1) {
                throw new Error("couldn't find the right doc")
            }
            return done();
        }).catch(_.noop);
    }

    @test("999 inserts and find") @timeout(5000)
    testInsertPerformance(done: Function) {
        let collection = new EntityCollectionBase("post", EntityCollectionBaseTest.db);
        let ps = [];
        for (let i=0;i<999;i++) {
            var s =_.padStart(i.toString(), 3, "0");
            let p = collection.insert({ a: "b" + s }, [ { store: 'c', c: "c" + s}], [{ key : 'a', val : 'special' + s }])
            ps.push(p);
        }
        Promise.all(ps).then((d) => {
            return collection.findByKey('a', 'special789');
        }).then((entities) => {

            if (entities.length != 1 || entities[0].core.a != "b789"  ) {
                var error = new Error("entity not found");
                (<any>error).expected = "expected";
                (<any>error).actual = "to fail";
                throw error;
            }
            return done();
        }).catch(_.noop);
    }

    @test("20 inserts and find with start with") @timeout(2000)
    testStartsWith(done: Function) {
        let collection = new EntityCollectionBase("post", EntityCollectionBaseTest.db);
        let ps = [];
        for (let i=0;i<20;i++) {
            var s =_.padStart(i.toString(), 2, "0");
            let p = collection.insert({ a: "b" + s }, [ { store: 'c', c: "c" + s}], [{ key : 'a', val : 'testStartsWith' + s }])
            ps.push(p);
        }
        Promise.all(ps).then((d) => {
            return collection.findByKey('a', 'testStartsWith1', {startsWith : true});
        }).then((entities) => {
            if (entities.length != 10 || !entities[0].core.a.startsWith('b1') ) {
                var error = new Error("entity not found");
                (<any>error).expected = "expected";
                (<any>error).actual = "to fail";
                throw error;
            }
            return done();
        }).catch(_.noop);
    }

    @test("inserts without find") @timeout(5000)
    testInsertNotFound(done: Function) {
        let collection = new EntityCollectionBase("post", EntityCollectionBaseTest.db);
        let ps = [];
        for (let i=1000;i<1999;i++) {
            var s =_.padStart(i.toString(), 3, "0");
            let p = collection.insert({ a: "b" + s }, [ { store: 'c', c: "c" + s}], [{ key : 'a', val : 'special' + s }])
            ps.push(p);
        }
        Promise.all(ps).then((d) => {
            return collection.findByKey('a', 'special9999');
        }).then((entities) => {
            if (entities.length == 0) {
                done();
            }
        }).catch(() => done());
    }

    @test("inserts similar") @timeout(2000)
    testSimilarDocs(done: Function) {
        let collection = new EntityCollectionBase("post", EntityCollectionBaseTest.db);
        let ps = [];
        for (let i=0;i<100;i++) {
            var s =_.padStart(i.toString(), 3, "0");
            let p = collection.insert({ a: "b" + s }, [ { store: 'c', c: "c" + s}], [{ key : 'a', val : 'testSimilarDocs' + s }])
            ps.push(p);
        }
        for (let i=0;i<100;i++) {
            var s =_.padStart(i.toString(), 3, "0");
            let p = collection.insert({ a: "b" + s }, [ { store: 'c', c: "c" + s}], [{ key : 'a', val : 'testSimilarDocs' + s }])
            ps.push(p);
        }
        Promise.all(ps).then((d) => {
            return collection.findByKey('a', 'testSimilarDocs030');
        }).then((entities) => {
            if (entities.length != 2) {
                throw new Error("error in finding similar docs")
            }
            done();
        }).catch(_.noop);
    }

    @test("insert and remove all") @timeout(7000)
    testInsertRemove(done: Function) {
        let collection = new EntityCollectionBase("post", EntityCollectionBaseTest.db);
        let ps = [];
        for (let i=0;i<100;i++) {
            var s =_.padStart(i.toString(), 3, "0");
            let p = collection.insert({ a: "b" + s }, [ { store: 'c', c: "c" + s}], [{ key : 'a', val : 'testInsertRemove' + s }])
            ps.push(p);
        }
        Promise.all(ps).then((ds) => {
            return collection.findByKey('a', 'testInsertRemove', {startsWith: true});
        }).then((es) => {
            if (es.length != 100) {
                throw new Error ("not all instances removed")
            }
            let ps = []
            for (let e of es) {
                ps.push(collection.remove(e));
            }
            return Promise.all(ps);
        }).then((ps) => {
            return collection.findByKey('a', 'testInsertRemove', { startsWith: true});
        }).then((es) => {
            if (es.length > 0) {
                throw new Error ("not all instances removed")
            }
            done();
        }).catch(_.noop);
    }

    @test("several entity with several decorators") @timeout(9000)
    testInsertSeveralDecorators(done: Function) {
        let collection = new EntityCollectionBase("post", EntityCollectionBaseTest.db);
        let ps = [];
        for (let i=0;i<100;i++) {
            var s =_.padStart(i.toString(), 3, "0");

            let stores = [];  
            for (var j=0;j<Math.random()*10;j++) {
                stores.push({ store: 'c' + j, c: "c" + s + j});
            }
            let keys = [];  
            for (var j=0;j<Math.random()*10;j++) {
                keys.push({ key : 'a', val : 'testInsertSeveralDecorators' + s + "-" + j});
            }
            let p = collection.insert({ a: "b" + s }, stores, keys)
            ps.push(p);
        }
        Promise.all(ps).then((d) => {
            return collection.findByKey('a', 'testInsertSeveralDecorators', {startsWith : true});
        }).then((es) => {
            if (es.length != 100) {
                console.log(es.length)
                throw new Error ("not all instances removed")
            }
            done();
        }).catch(_.noop);
    }

    @test ("missing db")
    testMissingDb() {
        try {
            let collection = new EntityCollectionBase("post", undefined);
        } catch(e) {
            return;
        }
        throw new Error("undefined db")
    }

}
