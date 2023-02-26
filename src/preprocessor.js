const Parser = require('stylus').Parser
const path = require('path')
const fs = require('fs')

module.exports = function (data, filename) {
  ;(function resolveImports() {
    const parts = data
      .split(/(@import +"(.*?)" *;?)|(@import +'(.*?)' *;?)/)
      .filter((part) => part || part === '')
    let i = 2
    while (parts[i]) {
      !path.extname(parts[i]) && (parts[i] += '.styl')
      const indent = parts[i - 2].split('\n').pop()
      try {
        let data = fs.readFileSync(
          path.resolve(path.dirname(filename), parts[i]),
          'utf8'
        )
        indent &&
          (data = data
            .split('\n')
            .map((line, index) => (index ? indent : '') + line)
            .join('\n'))
        parts[i - 2] += data
      } catch (err) {
        parts[i - 2] += parts[i - 1]
      }
      delete parts[i]
      delete parts[i - 1]
      i += 3
    }
    data = parts.join('')
  })()

  const parts = data.split(/^(proportional\(.*?,.*?\))/m)
  if (parts.length === 1) return data

  const props = {} // All lines having properties
  const children = {} // Children (nodes) of the blocks
  function analyze(block) {
    const nodes = new Parser(block, { cache: false }).parse().nodes || []

    function dfs(node) {
      const lineno = node.lineno - 1
      const type = node.constructor.name
      if (type === 'Group') for (const child of node.nodes) dfs(child)
      else if (type === 'Property') props[lineno] = true
      else if (node.block?.nodes.length) {
        children[lineno] = children[lineno] || []
        const addChild = (node) => {
          children[lineno].push(node.lineno - 1)
          dfs(node)
        }
        for (const child of node.block.nodes) {
          if (child.constructor.name === 'Group')
            (child.nodes || []).forEach((node) => addChild(node))
          else addChild(child)
        }
      }
    }

    for (const node of nodes) dfs(node)
  }

  const dataToAnalyze = parts.filter((_, i) => i % 2 === 0).join('\n')
  analyze(dataToAnalyze)

  const lines = dataToAnalyze.split('\n')
  const braces = []
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/{/)) {
      if (!children[i])
        for (let j = i; j >= 0; j--)
          if (children[j]) {
            children[i] = children[j]
            break
          }

      let count = 0
      for (let j = i; j < lines.length; j++) {
        if (lines[j].match(/{/) && j !== i) count++
        else if (lines[j].match(/}/) && !count--) {
          children[j] = children[i]
          braces.push(j)
          break
        }
      }
    }
  }

  // Skip the last splitted part, which is not responsive
  for (let i = 1; i < parts.length - 1; i += 2) {
    let args = parts[i].match(/^proportional\((.*?),(.*?)\)/)
    if (args && args[1] && args[2]) {
      args = [args[1].trim(), parseFloat(args[2].trim())]

      let lines = []
      for (let j = 0; j < i; j += 2)
        lines = lines.concat(parts[j].split(/\r?\n/))

      for (let j = lines.length - 1; j >= 0; j--) {
        let line = lines[j]
        if (props[j]) {
          if (
            !line.match(
              /(((?![A-Za-z0-9-_]).)|^)(@proportional-skip)(?=(((?![A-Za-z0-9-_]).)|$))/
            )
          )
            line = line.replace(
              /(((?![A-Za-z0-9-_\.]).)|^)-?((\d+(\.\d+)?)|(\.\d+))px(?=(((?![A-Za-z0-9-_\.]).)|$))/g,
              (val) => {
                const num = parseFloat(
                  val
                    .replace(/^((?![A-Za-z0-9-_\.]).)?/, '')
                    .replace(/px.*$/, '')
                )
                const newValue = num * args[1]
                return val.replace(
                  /-?((\d+(\.\d+)?)|(\.\d+))/,
                  Math.round(newValue) || Math.ceil(newValue)
                )
              }
            )
          if (line === lines[j]) lines[j] = null
          else lines[j] = '\t' + line
        } else {
          if ((children[j] || []).filter((k) => lines[k]).length)
            lines[j] = '\t' + line
          else lines[j] = null
        }
      }

      for (const j of braces)
        if ((children[j] || []).filter((k) => lines[k]).length === 0)
          lines[j] = null

      lines = lines.filter(Boolean)
      if (lines.length)
        lines = [
          '@media ' +
            (args[0].match(/^\(.*\)$/) ? args[0] : '(' + args[0] + ')'),
          ...lines,
        ]

      parts[i] = lines.join('\n')
    }
  }

  return parts.join('\n')
}
