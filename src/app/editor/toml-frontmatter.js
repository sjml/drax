// Adapted from https://github.com/codemirror/CodeMirror/blob/master/mode/yaml-frontmatter/yaml-frontmatter.js
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function (mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(
      require("../../../node_modules/codemirror/lib/codemirror"),
      require("../../../node_modules/codemirror/mode/yaml/yaml"),
    )
  else if (typeof define == "function" && define.amd) // AMD
    define(
      [
        "../../../node_modules/codemirror/lib/codemirror",
        "../../../node_modules/codemirror/mode/yaml/yaml",
      ], mod)
  else // Plain browser env
    mod(CodeMirror)
})(function (CodeMirror) {

  var START = 0, FRONTMATTER = 1, BODY = 2

  // a mixed mode for Markdown text with an optional YAML front matter
  CodeMirror.defineMode("toml-frontmatter", function (config, parserConfig) {
    var yamlMode = CodeMirror.getMode(config, "yaml")
    var innerMode = CodeMirror.getMode(config, parserConfig && parserConfig.base || "gfm")

    function curMode(state) {
      return state.state == BODY ? innerMode : yamlMode
    }

    return {
      startState: function () {
        return {
          state: START,
          inner: CodeMirror.startState(yamlMode)
        }
      },
      copyState: function (state) {
        return {
          state: state.state,
          inner: CodeMirror.copyState(curMode(state), state.inner)
        }
      },
      token: function (stream, state) {
        if (state.state == START) {
          if (stream.match(/---/, false)) {
            state.state = FRONTMATTER
            return yamlMode.token(stream, state.inner)
          } else {
            state.state = BODY
            state.inner = CodeMirror.startState(innerMode)
            return innerMode.token(stream, state.inner)
          }
        } else if (state.state == FRONTMATTER) {
          var end = stream.sol() && stream.match(/---/, false)
          var style = yamlMode.token(stream, state.inner)
          if (end) {
            state.state = BODY
            state.inner = CodeMirror.startState(innerMode)
          }
          return style
        } else {
          return innerMode.token(stream, state.inner)
        }
      },
      innerMode: function (state) {
        return {mode: curMode(state), state: state.inner}
      },
      blankLine: function (state) {
        var mode = curMode(state)
        if (mode.blankLine) return mode.blankLine(state.inner)
      }
    }
  })
});
