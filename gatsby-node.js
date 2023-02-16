'use strict'

/**
 * Usage:
 *
 * // gatsby-config.js
 * plugins: [
 *  'stylus-proportional',
 * ],
 */

exports.onCreateWebpackConfig = ({ actions, getConfig }) => {
  const config = getConfig()

  const stylusRules = config.module.rules.find(({ oneOf }) =>
    String(oneOf && oneOf[0] && oneOf[0].test).includes('\\.styl$')
  )
  if (stylusRules)
    for (const rule of stylusRules.oneOf)
      if (rule.use.find(({ loader }) => loader.includes('/stylus-loader/')))
        rule.use.push(require.resolve('stylus-proportional'))

  actions.replaceWebpackConfig(config)
}
