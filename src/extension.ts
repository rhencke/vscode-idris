import * as vscode from 'vscode'
import * as controller from './controller'
import IdrisCompletionProvider from './providers/idris/completionProvider'
import IdrisHoverProvider from './providers/idris/hoverProvider'
import IdrisDefinitionProvider from './providers/idris/definitionProvider'
import IdrisDocumentSymbolProvider from './providers/idris/documentSymbolProvider'
import IdrisWorkspaceSymbolProvider from './providers/idris/workspaceSymbolProvider'
import IdrisReferenceProvider from './providers/idris/referenceProvider'
import IdrisRenameProvider from './providers/idris/renameProvider'
import IdrisDocumentHighlightProvider from './providers/idris/documentHighlightProvider'
import IdrisSignatureHelpProvider from './providers/idris/signatureHelpProvider'
import IPKGDefinitionProvider from './providers/ipkg/definitionProvider'
import IPKGCompletionProvider from './providers/ipkg/completionProvider'

let idrisExecutablePath = vscode.workspace.getConfiguration('idris').get<string>('executablePath')

let triggers: string[] = []
for (let i = 0; i < 26; i++) {
  triggers.push(String.fromCharCode(97 + i))
  triggers.push(String.fromCharCode(65 + i))
}

function activate(context: vscode.ExtensionContext) {
  vscode.languages.setLanguageConfiguration("idris", {
    indentationRules: {
      decreaseIndentPattern: /[}][ \t]*$/m,
      increaseIndentPattern: /((\b(if\b.*|then|else|do|of|let|in|where))|=|->|>>=|>=>|=<<|(^(data)( |\t)+(\w|')+( |\t)*))( |\t)*$/
    }
  })

  context.subscriptions.push(controller.tcDiagnosticCollection)
  context.subscriptions.push(controller.buildDiagnosticCollection)
  context.subscriptions.push(controller.nonTotalDiagnosticCollection)
  controller.getCommands().forEach(([key, value]) => {
    let k = key
    let v = value
    let disposable = vscode.commands.registerCommand(key as string, value)
    context.subscriptions.push(disposable)
  })
  context.subscriptions.push(vscode.languages.registerCompletionItemProvider(controller.IDRIS_MODE, new IdrisCompletionProvider(), ...triggers))
  context.subscriptions.push(vscode.languages.registerHoverProvider(controller.IDRIS_MODE, new IdrisHoverProvider()))
  context.subscriptions.push(vscode.languages.registerDefinitionProvider(controller.IDRIS_MODE, new IdrisDefinitionProvider()))
  context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(controller.IDRIS_MODE, new IdrisDocumentSymbolProvider()))
  context.subscriptions.push(vscode.languages.registerWorkspaceSymbolProvider(new IdrisWorkspaceSymbolProvider()))
  context.subscriptions.push(vscode.languages.registerReferenceProvider(controller.IDRIS_MODE, new IdrisReferenceProvider()))
  context.subscriptions.push(vscode.languages.registerRenameProvider(controller.IDRIS_MODE, new IdrisRenameProvider()))
  context.subscriptions.push(vscode.languages.registerDocumentHighlightProvider(controller.IDRIS_MODE, new IdrisDocumentHighlightProvider()))
  context.subscriptions.push(vscode.languages.registerSignatureHelpProvider(controller.IDRIS_MODE, new IdrisSignatureHelpProvider(), " "))
  context.subscriptions.push(vscode.languages.registerDefinitionProvider(controller.IPKG_MODE, new IPKGDefinitionProvider()))
  context.subscriptions.push(vscode.languages.registerCompletionItemProvider(controller.IPKG_MODE, new IPKGCompletionProvider(), ...triggers))
  context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(() => {
    controller.typeCheckOnSave()
    IdrisCompletionProvider.buildCompletionList()
    IPKGCompletionProvider.buildCompletionList()
  }))
  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
    let newIdrisExecutablePath = vscode.workspace.getConfiguration('idris').get('executablePath')
    if (idrisExecutablePath != newIdrisExecutablePath) {
      idrisExecutablePath = newIdrisExecutablePath
      controller.reInitialize()
    }
  }))
  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => {
    IdrisCompletionProvider.buildCompletionList()
    IPKGCompletionProvider.buildCompletionList()
  }))
  if (vscode.window.activeTextEditor) {
    IdrisCompletionProvider.buildCompletionList()
    IPKGCompletionProvider.buildCompletionList()
  }
}
exports.activate = activate

function deactivate() {
  controller.destroy(false)
}
exports.deactivate = deactivate
