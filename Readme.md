# gulp-go

[![Build Status](https://travis-ci.org/nowk/gulp-go.svg?branch=master)](https://travis-ci.org/nowk/gulp-go)
[![David DM](https://david-dm.org/nowk/gulp-go.png)](https://david-dm.org/nowk/gulp-go)

`go run` for gulp

## Install

    npm install gulp-go

## Usage

    var gulp   = require("gulp");
    var gulpgo = require("gulp-go");

    var go;

    gulp.task("go-run", function() {
      go = gulpgo.run("main.go", ["--arg1", "value1"], {
	    cwd: __dirname,
	    onStdout: function(buffer) { console.log(buffer.toString('utf8')); },
	    onStderr:  function(buffer) { console.error(buffer.toString('utf8')); }
	  });
    });

    gulp.task("devs", ["go-run"], function() {
      gulp.watch([__dirname+"/**/*.go"]).on("change", function() {
        go.restart();
      });
    });

## License

MIT
