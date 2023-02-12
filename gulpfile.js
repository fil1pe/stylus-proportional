const gulp = require('gulp')
const preprocessor = require('./index').gulp
const stylus = require('gulp-stylus')

gulp.task('stylus', function () {
  return gulp
    .src(['examples/styl/index.styl'])
    .pipe(preprocessor())
    .pipe(stylus())
    .pipe(gulp.dest('examples/css'))
})

gulp.task('watch', function () {
  gulp.watch('examples/styl/**/*.styl', gulp.series('stylus'))
})

gulp.task('default', gulp.series('stylus', 'watch'))
