import * as commands from '../../idris/commands'
import * as controller from '../../controller'
import * as common from '../../analysis/common'
import * as findDefinition from '../../analysis/find-definition'
import * as vscode from 'vscode'

export default class IdrisDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(_document: vscode.TextDocument, _token: vscode.CancellationToken) {
    return new Promise((resolve, _reject) => {
      controller.withCompilerOptions((uri) => {
        let moduleName = common.getModuleName(uri)
        if (!moduleName) resolve(null)

        commands.getModel().load(uri).filter((arg) => {
          return arg.responseType === 'return'
        }).flatMap(() => {
          return commands.getModel().browseNamespace(moduleName)
        }).subscribe(
          function (arg) {
            let symbols: vscode.SymbolInformation[] = []
            arg.msg[0][1].forEach((a) => {
              let name = a[0].split(":")[0].trim()
              let def = findDefinition.findDefinitionInFiles(name, uri)
              if (def) {
                let pos = new vscode.Position(def.line, def.column)
                let loc = new vscode.Location(vscode.Uri.file(def.path), pos)
                let info = new vscode.SymbolInformation(
                  name,
                  vscode.SymbolKind.Function,
                  "",
                  loc
                )
                symbols.push(info)
              }
            })
            resolve(symbols)
          },
          function (err) {
            vscode.window.showWarningMessage(`${err.message} : ${moduleName}`)
            resolve(null)
          })
      })
    })
  }
}
