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
      if (node.constructor.name === 'Property') props[lineno] = true
      children[lineno] = children[lineno] || []
      if (node.block)
        for (const nextNode of node.block.nodes || []) {
          children[lineno].push(nextNode.lineno - 1)
          dfs(nextNode)
        }
      if (node.nodes)
        for (const nextNode of node.nodes) {
          children[lineno].push(nextNode.lineno - 1)
          dfs(nextNode)
        }
    }

    for (const node of nodes) dfs(node)
  }

  analyze(parts.filter((_, i) => i % 2 === 0).join('\n'))

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
