const preprocessor = require('./preprocessor')

module.exports = function (source) {
  return preprocessor(source, this.resourcePath)
}
