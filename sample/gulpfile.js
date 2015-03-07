var path = require("path");
var gulp = require("gulp");

var gulpgo = require("../");

var go;

function out(prefix) {
  prefix = (prefix || "");
  return function(data) {
    console.log(prefix, data.toString());
  };
}

gulp.task("go-run", function() {
  go = gulpgo.run("main.go", [], {
    cwd:       __dirname,
    onStdout:  out(),
    onStderr:  out("[error]"),
    onClose:   out("close"),
    onExit:    out("exit")
  });
});

gulp.task("devs", ["go-run"], function() {
  gulp.watch([__dirname+"/**/*.go"]).on("change", function() {
    go.restart();
  });
});
