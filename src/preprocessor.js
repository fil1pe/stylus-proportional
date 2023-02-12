const Parser = require('stylus').Parser

module.exports = function (data) {
  const parts = data.split(/^(proportional\(.*?,.*?\))/m)
  if (parts.length === 1) return data

  const props = {} // All lines having properties
  const children = {} // Children (nodes) of the blocks
  function analyze(block) {
    const nodes = new Parser(block).parse().nodes || []

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
    let args = parts[i].match(/proportional\((.*?),(.*?)\)/)
    if (args && args[1] && args[2]) {
      args = [args[1].trim(), parseFloat(args[2].trim())]

      let lines = []
      for (let j = 0; j < i; j += 2)
        lines = lines.concat(parts[j].split(/\r?\n/))

      for (let j = lines.length - 1; j >= 0; j--) {
        let line = lines[j]
        if (props[j]) {
          line = line.replace(/ ((\d+(\.\d+)?)|(\.\d+))px/g, (val) => {
            val = val.trim().replace('px', '')
            const newValue = Math.round(val * args[1])
            return ' ' + (newValue || Math.ceil(val * args[1])) + 'px'
          })
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

      lines = lines.filter((i) => i)
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
