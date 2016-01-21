var gulp = require('gulp'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    browserSync = require('browser-sync');

gulp.task('default', function() {
    console.log('hello world');
});


gulp.task('jsmin', function () {
    gulp.src("js/schart.js")
        .pipe(uglify())
        .pipe(concat('all.js'))
        .pipe(gulp.dest("dest/"));
});

gulp.task('jsmin2', function () {
    gulp.src("js/test.js")
        .pipe(uglify())
        .pipe(concat('all.js'))
        .pipe(gulp.dest("dest/"));
});



gulp.task('watch', function () {
    gulp.watch('js/schart.js', ['jsmin','browser-sync']);
});


gulp.task('browser-sync', function() {
    browserSync({
        files: "**",
        server: {
            baseDir: "./"
        }
    });
});

//browser-sync start --proxy "localhost:80" --files "js/schart.js"