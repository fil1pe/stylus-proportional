function testRule({ test }) {
  return (
    test &&
    (test.some
      ? test.some(
          (test) => 'test.module.styl'.match(test) || 'test.styl'.match(test)
        )
      : 'test.module.styl'.match(test) || 'test.styl'.match(test))
  )
}

module.exports = (nextConfig) => ({
  ...nextConfig,

  webpack: (config) => {
    if (nextConfig.webpack) config = nextConfig.webpack(config)

    const stylusRules = config.module.rules.filter(
      ({ oneOf }) => oneOf && oneOf.some(testRule)
    )
    for (const { oneOf } of stylusRules) {
      const stylusRules = oneOf.filter(testRule)

      for (const rule of stylusRules) {
        const stylusLoaderIndex = rule.use.indexOf
          ? rule.use.indexOf('stylus-loader')
          : -1
        if (stylusLoaderIndex !== -1)
          rule.use.push(require.resolve('stylus-proportional'))
      }
    }
    return config
  },
})
