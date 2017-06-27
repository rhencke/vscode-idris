import * as commands from '../../idris/commands'
import * as common from '../../analysis/common'
import * as findDefinition from '../../analysis/find-definition'
import * as vscode from 'vscode'
import * as _ from 'lodash'


export default class IdrisDocumentHighlightProvider implements vscode.DocumentHighlightProvider {
  provideDocumentHighlights(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken) {
    let [currentWord, _wordRange] = commands.getWordBase(document, position, true)
    if (!currentWord) return null

    let uri = document.uri.fsPath
    let currentWordDef = findDefinition.findDefinitionInFiles(currentWord, uri)

    if (currentWordDef != undefined) {
      return new Promise((resolve, _reject) => {
        let uniIdents = common.getIdents(uri)
        let positions = uniIdents.filter((name) => {
          if (name == currentWord) {
            let def = findDefinition.findDefinitionInFiles(name, uri)
            if (def == undefined) {
              return false
            } else {
              return common.isDefinitonEqual(currentWordDef, def)
            }
          } else {
            return false
          }
        }).map((name) => {
          return common.getAllPositions(name, uri)
        })
        let uniPositions = _.uniqWith(_.flatten(positions), _.isEqual)
        let highlights = uniPositions.map(({ _uri, line, column }) => {
          let startPos = new vscode.Position(line, column)
          let endPos = new vscode.Position(line, column + currentWord.length)
          let range = new vscode.Range(startPos, endPos)
          return new vscode.DocumentHighlight(range, vscode.DocumentHighlightKind.Text)
        })
        resolve(highlights)
      })
    } else {
      return common.getAllPositions(currentWord, uri).map(({ uri, line, column }) => {
        let startPos = new vscode.Position(line, column)
        let endPos = new vscode.Position(line, column + currentWord.length)
        let range = new vscode.Range(startPos, endPos)
        return new vscode.DocumentHighlight(range, vscode.DocumentHighlightKind.Text)
      })
    }
  }
}
