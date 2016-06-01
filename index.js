var treeKill = require("tree-kill");
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
    go.stop(function() {
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
  if (typeof(this.main) == 'string') {
    this.main = [this.main];
  }
  this.args = args || [];
  this.opts = opts || {};
}

GoRun.prototype._spawn = function() {
  var args = Array.prototype.slice.call(arguments);
  log("starting process...");

  if (this.opts.godep) {
    log("using `godep go`");
    args.unshift("go");
    return spawn("godep", args, this.opts);
  } else {
    return spawn("go", args, this.opts);
  }
};

var noop = function() {
  //
};

GoRun.prototype.run = function() {
  var args = ["run"].concat(this.main);
  args = args.concat(this.args, Array.prototype.slice.call(arguments));

  var proc = this.proc = this._spawn.apply(this, args);
  var pid = proc.pid;
  log("["+pid+"]", "processs started");

  if (proc.stdout) {
    proc.stdout.on("data", this.opts.onStdout || noop);
  }
  if (proc.stderr) {
    proc.stderr.on("data", this.opts.onStderr || noop);
  }
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
  treeKill(pid, 'SIGKILL', function(err) {
    if(err) {
      log(err);
	  callback();
    } else {
      log("["+pid+"]", "process stopped");
      callback();
    }
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
