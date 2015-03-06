var util   = require("util");
var assert = require("chai").assert;

var gulpgo = require("./");
var GoRun  = gulpgo.GoRun;

function MyRun() {
  var args = Array.prototype.slice.call(arguments);
  GoRun.apply(this, args);
}

util.inherits(MyRun, GoRun);

describe("GoRun", function() {
  var args;
  var start = 0;
  var stop = 0;
  var pid = 123;
  var callback = 0;

  // stub _spawn
  MyRun.prototype._spawn = function() {
    args = Array.prototype.slice.call(arguments);
    start++;

    return {
      pid: pid
    };
  };

  // stup _stop
  MyRun.prototype._stop = function(callback) {
    stop++;
    callback();
  };

  beforeEach(function() {
    args = null;
    start = 0;
    stop = 0;
    pid = 123;
    callback = 0;
  });

  it("starts a go run process", function() {
    var go = new MyRun("mymain.go", ["--foo", "bar"]);
    assert.deepEqual(go, go.run());
    assert.deepEqual(["run", "mymain.go", "--foo", "bar"], args);
    assert.equal(start, 1);
  });

  it("appends args sent on run", function() {
    var go = new MyRun("mymain.go", ["--foo", "bar"]);
    go.run("--baz", "qux", "--foo", "bar");
    assert.deepEqual([
      "run", "mymain.go", "--foo", "bar", "--baz", "qux", "--foo", "bar"
    ], args);
  });

  it("adds the process to the global ps store", function() {
    var go = new MyRun("main.go");
    go.run();
    assert.deepEqual(gulpgo.ps()[123], go);
  });

  it("stop stops and removes from global ps store", function() {
    var go = new MyRun("main.go");
    go.run();
    go.stop(function() {
      callback++;
    });
    assert.deepEqual(gulpgo.ps(), {});
    assert.equal(stop, 1);
    assert.equal(callback, 1);
  });

  it("Restart restarts process", function() {
    var go = new MyRun("mymain.go", ["--foo", "bar"]);
    go.run();

    call = ""; // reset call, to re-assert
    pid = 456; // change pid

    go.restart();
    assert.deepEqual(["run", "mymain.go", "--foo", "bar"], args);
    assert.equal(start, 2);
    assert.equal(stop, 1);
    assert.isUndefined(gulpgo.ps()[123]);
    assert.deepEqual(gulpgo.ps()[456], go);
  });
});
