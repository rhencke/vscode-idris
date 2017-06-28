import * as commands from '../../idris/commands'
import * as common from '../../analysis/common'
import * as findDefinition from '../../analysis/find-definition'
import * as vscode from 'vscode'
import * as _ from 'lodash'


export default class IdrisReferenceProvider implements vscode.ReferenceProvider {
  provideReferences(document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Location[]> {
    let [currentWord, _wordRange] = commands.getWordBase(document, position, true)
    if (!currentWord) return null

    let currentWordDef = findDefinition.findDefinitionInFiles(currentWord, document.uri.fsPath)

    return new Promise((resolve, _reject) => {
      let uniIdents = common.getAllIdents()
      let positions = uniIdents.filter(({ name, uri }) => {
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
      }).map(({ name, uri }) => {
        return common.getAllPositions(name, uri)
      })
      let uniPositions = _.uniqWith(_.flatten(positions), _.isEqual)
      let locations = uniPositions.map(({ uri, line, column }) => {
        let pos = new vscode.Position(line, column)
        let range = new vscode.Range(pos, pos)
        return new vscode.Location(vscode.Uri.file(uri), range)
      })
      resolve(locations)
    })
  }
}
