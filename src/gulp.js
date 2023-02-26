const through = require('through2')
const extname = require('path').extname
const preprocessor = require('./preprocessor')
const PluginError = require('plugin-error')

function gulpError(err) {
  return new PluginError('gulp-stylus', err)
}

module.exports = function () {
  return through.obj(function (file, enc, cb) {
    if (file.isStream()) return cb(gulpError('Streaming not supported'))
    else if (file.isNull() || extname(file.path) === '.css')
      return cb(null, file)

    file.contents = Buffer.from(
      preprocessor(file.contents.toString(enc || 'utf-8'), file.path)
    )

    return cb(null, file)
  })
}
