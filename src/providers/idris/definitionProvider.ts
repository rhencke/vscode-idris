import * as commands from '../../idris/commands'
import * as common from '../../analysis/common'
import * as findDefinition from '../../analysis/find-definition'
import Definition from '../../Definition'
import * as vscode from 'vscode'

export default class IdrisDefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.Definition> {
    let [currentWord, _wordRange] = commands.getWordBase(document, position, true)
    if (!currentWord) return null

    let uri = document.uri.fsPath
    return new Promise((resolve, _reject) => {
      let currentLine = document.lineAt(position).text
      let match = common.getImportPattern().exec(currentLine + "\r\n")
      if (match && match[2].includes(currentWord)) {
        let loc = findDefinition.findDefinitionForModule(match[2])
        resolve(loc)
      } else if(/(\w+)\.(\w+)/i.test(currentWord)) {
        let match = /(\w+)\.(\w+)/i.exec(currentWord)
        let moduleAliasName = match[1].trim()
        let identifier = match[2].trim()
        let loc = findDefinition.findDefinitionWithAliasInFiles(identifier, moduleAliasName, uri)
        resolve(loc)
      } else {
        let loc = findDefinition.findDefinitionInFiles(currentWord, uri)
        resolve(loc)
      }
    }).then(function (loc: Definition) {
      if (loc) {
        let pos = new vscode.Position(loc.line, loc.column)
        return new vscode.Location(vscode.Uri.file(loc.path), pos)
      } else {
        return null
      }
    })
  }
}
