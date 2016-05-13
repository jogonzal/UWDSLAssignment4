
"use strict";

mocha.setup("bdd");

describe("Problem 1", function() {
    it("Creating a Stream", function() {
        var out = new Stream();
        chai.expect(out).to.be.an("Object");
    });

    it("Subscribe and _push", function() {
        var elts = [];
        var out = new Stream();
        out.subscribe(function(x) { elts.push(x) });
        out._push(1);
        out._push(2);
        out._push(3);
        chai.expect(elts).to.deep.equal([1, 2, 3]);
    });

    it("_push_many", function() {
        var elts = [];
        var out = new Stream();
        out.subscribe(function(x) { elts.push(x) });
        out._push_many([1, 2, 3]);
        chai.expect(elts).to.deep.equal([1, 2, 3]);
    });
    
    it("first", function() {
        var elts = [];
        var out = new Stream();
        out.first().subscribe(function(x) { elts.push(x) });
        out._push_many([1, 2, 3]);
        chai.expect(elts).to.deep.equal([1]);
    });

    it("map", function() {
        var elts = [];
        var out = new Stream();
        out.map(function(x) { return x % 2; })
            .subscribe(function(x) { elts.push(x) });
        out._push_many([1, 2, 3]);
        chai.expect(elts).to.deep.equal([1, 0, 1]);
    });
    
    it("filter", function() {
        var elts = [];
        var out = new Stream();
        out.filter(function(x) { return x % 2 == 1; })
            .subscribe(function(x) { elts.push(x) });
        out._push_many([1, 2, 3]);
        chai.expect(elts).to.deep.equal([1, 3]);
    });

    it("flatten", function() {
        var elts = [];
        var out = new Stream();
        out.map(function(x) { return Array(x).fill(x) })
            .flatten()
            .subscribe(function(x) { elts.push(x) });
        out._push_many([1, 2, 3]);
        chai.expect(elts).to.deep.equal([1, 2, 2, 3, 3, 3]);
    });

    it("join", function() {
        var elts = [];
        var out1 = new Stream();
        var out2 = new Stream();
        out1.join(out2).subscribe(function(x) { elts.push(x) });
        out1._push(1);
        out2._push(2);
        out1._push(3);
        chai.expect(elts).to.deep.equal([1, 2, 3]);
    });
    
    it("combine", function() {
        var elts = [];
        var out = new Stream();
        out.map(function(x) { return out })
            .combine()
            .subscribe(function(x) { elts.push(x) });
        out._push_many([1, 2, 3]);
        chai.expect(elts).to.deep.equal([1, 2, 2, 3, 3, 3]);
    });

    it("zip", function() {
        var elts = [];
        var out1 = new Stream();
        var out2 = new Stream();
        out1.zip(out2, function(x, y) { return x * y; })
            .subscribe(function(x) { elts.push(x) });
        out1._push(1);
        out2._push(2);
        out1._push(-1);
        out1._push(0);
        out1._push(5);
        out2._push(3);
        out1._push(1);
        out2._push(2);
        chai.expect(elts).to.deep.equal([2, -2, 0, 10, 15, 3, 2]);
    });
});


