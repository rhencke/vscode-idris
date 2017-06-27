import * as commands from '../../idris/commands'
import * as controller from '../../controller'
import * as vscode from 'vscode'
import * as Rx from 'rx-lite'

export default class IdrisHoverProvider implements vscode.HoverProvider {
  provideHover(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
    let [currentWord, wordRange] = commands.getWordBase(document, position, true)
    if (!currentWord) return null

    return new Promise((resolve, _reject) => {
      controller.withCompilerOptions((uri) => {
        let filePath = vscode.Uri.file(uri)
        if (commands.tcDiagnosticCollection.has(filePath)) {
          let diagnostics = commands.tcDiagnosticCollection.get(filePath)
          diagnostics.forEach((d) => {
            if (d.range.contains(wordRange)) {
              resolve(null)
            }
          })
        }

        let hoverMode = vscode.workspace.getConfiguration('idris').get('hoverMode')

        if (hoverMode == 'none') {
          resolve(null)
        }

        commands.getModel().load(uri).filter((arg) => {
          return arg.responseType === 'return'
        }).flatMap(() => {
          return Rx.Observable.zip<ideDocResponse, ideDocResponse>(commands.getModel().getType(currentWord), commands.getModel().getDocs(currentWord))
        }).subscribe(
          function (arg) {
            let typeMsg = arg[0].msg[0]
            let infoMsg = arg[1].msg[0].replace(/\n    \n    /g, "").replace(/\n        \n        /g, "")
            if (hoverMode == 'info') {
              resolve(infoMsg)
            } else if (hoverMode == 'type') {
              resolve(typeMsg)
            } else if (hoverMode == 'fallback') {
              if (infoMsg) {
                resolve(infoMsg)
              } else {
                resolve(typeMsg)
              }
            } else {
              vscode.window.showErrorMessage("Invalid option for idris.hoveMode")
              resolve(null)
            }
          },
          function (err) {
            if (err.warnings && err.warnings.length > 0) {
              resolve(err.warnings[0][3])
            } else {
              resolve(err.message)
            }
          })
      })
    }).then(function (info: string) {
      if (info != null) {
        return new vscode.Hover({
          language: 'idris',
          value: info
        })
      } else {
        return null
      }
    })
  }
}
