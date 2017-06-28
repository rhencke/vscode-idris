const common = require('../../analysis/common')
const completionUtil = require('../completionUtil')
const vscode = require('vscode')
const Maybe = require('../../maybe')

let identList

let buildCompletionList = () => {
  Maybe.of(vscode.window.activeTextEditor).map((editor) => {
    let uri = editor.document.uri.fsPath
    identList = common.getIdents(uri)
  })
}

let IPKGCompletionProvider = (function () {
  function IPKGCompletionProvider() { }

  provideCompletionItems(document, position, _token) {
    let wordRange = document.getWordRangeAtPosition(position, /(\\)?'?\w+(\.\w+)?'?/i)
    let currentWord = document.getText(wordRange).trim()

    let trimmedPrefix = currentWord.trim()

    if (trimmedPrefix.length >= 2) {
      let identItems = identList.filter((ident) => {
        return ident.startsWith(trimmedPrefix) || ident.toLowerCase().startsWith(trimmedPrefix)
      }).map((ident) => {
        return new vscode.CompletionItem(ident, 0)
      })
      return identItems
        .concat(completionUtil.ipkgKeywordCompletionItems(trimmedPrefix))
        .concat(completionUtil.getModuleNameCompletionItems(trimmedPrefix))
    } else {
      return null
    }
  }
}

module.exports = {
  IPKGCompletionProvider,
  buildCompletionList
}
