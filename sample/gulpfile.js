var path = require("path");
var gulp = require("gulp");

var gulpgo = require("../");

var go;

gulp.task("go-run", function() {
  go = gulpgo.run("main.go", [], {cwd: __dirname});
});

gulp.task("devs", ["go-run"], function() {
  gulp.watch([__dirname+"/**/*.go"]).on("change", function() {
    go.restart();
  });
});
