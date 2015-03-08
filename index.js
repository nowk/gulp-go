var pstree = require("ps-tree");
var spawn  = require("child_process").spawn;
var exec   = require("child_process").exec;

var logPrefix = "[go-run]";

function log() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift(logPrefix);
  console.log.apply(console, args);
}

// ps is a collection object to hold references to running GoRuns
var ps = {};

function delps(pid) {
  delete ps[pid];
}

function addps(pid, go) {
  ps[pid] = go;

  return go;
}

// fshut provides a method to kill running processes started through GoRuns
// This is not a general shutdown method, but a way to handle shutdowns when
// gulp exits due to an uncaughtException.
var fshut = function(callback) {
  var keys = Object.keys(ps);
  if (keys.length === 0) {
    if ("function" === typeof callback) {
      callback();
    }
    return;
  }

  var go = ps[keys[0]];
  if (go) {
    var pid = go.proc.pid;

    go.stop(function() {
      delps(pid);      // delete from ps collection
      fshut(callback); // shutdown the next process
    });
  }
};

process.on("uncaughtException", function(err) {
  log("uncaught exception", err);
  log("forcing shutdown");
  fshut(function() {
    log("forcing shutdown: complete");
    process.exit(1);
  });
});

/*
 * expose
 */

module.exports = {
  ps: function() {
    return ps;
  },
  run: function(main, args, opts) {
    var go = new GoRun(main, args, opts);
    return go.run();
  },
  GoRun: GoRun
};

// GoRun is the runner class for a single `go run ...` process
function GoRun(main, args, opts) {
  this.main = main || "main.go";
  this.args = args || [];
  this.opts = opts || {};
}

GoRun.prototype._spawn = function() {
  var args = Array.prototype.slice.call(arguments);
  log("starting process...");

  return spawn("go", args, this.opts);
};

var noop = function() {
  //
};

GoRun.prototype.run = function() {
  var args = ["run", this.main];
  args = args.concat(this.args, Array.prototype.slice.call(arguments));

  var proc = this.proc = this._spawn.apply(this, args);
  var pid = proc.pid;
  log("["+pid+"]", "processs started");

  proc.stdout.on("data", this.opts.onStdout || noop);
  proc.stderr.on("data", this.opts.onStderr || noop);
  proc.on("close", this.opts.onClose || noop);
  proc.on("exit", this.opts.onExit || noop);

  return addps(pid, this);
};

GoRun.prototype._stop = function(callback) {
  if (!!!this.proc.pid) {
    log("no pid:", "exit");

    callback();
    return;
  }

  var pid = this.proc.pid;
  pstree(pid, function (err, children) {
    var i = 0;
    var len = children.length;

    var kill = function(n) {
      var child = children[n];
      if (!!!child) {
        callback();
        return;
      }

      exec("kill " + child.PID, function() {
        i++;
        if (i === len) {
          log("["+pid+"]", "process stopped");

          callback();
          return;
        }

        kill(i);
      });
    };

    kill(i);
  });
};

GoRun.prototype.stop = function(callback) {
  if ("function" !== typeof callback) {
    callback = noop;
  }

  var pid = this.proc.pid;
  log("["+pid+"]", "stopping process...");

  var self = this;
  var fn = function() {
    delps(pid);

    callback();
  };

  this._stop(fn);
};

GoRun.prototype.restart = function() {
  var pid = this.proc.pid;
  log("["+pid+"]", "restarting process...");

  var self = this;
  self.stop(function() {
    self.run();
  });
};

