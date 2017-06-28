import * as ipkg from './ipkg/ipkg'
import * as commands from './idris/commands'
import * as common from './analysis/common'
import * as vscode from 'vscode'
import * as fs from 'fs'
import * as cp from 'child_process'
import * as path from 'path'
import Maybe from './maybe'

export const IDRIS_MODE = [
  { language: 'idris', scheme: 'file' },
  { language: 'lidris', scheme: 'file' }
]

export const IPKG_MODE = { language: 'ipkg', scheme: 'file' }

export let getCommands = (): [string, (..._: {}[])=> void][] => {
  return [
    ['idris.typecheck', runCommand(commands.typecheckFile)],
    ['idris.type-of', runCommand(commands.typeForWord)],
    ['idris.docs-for', runCommand(commands.docsForWord)],
    ['idris.print-definition', runCommand(commands.printDefinition)],
    ['idris.show-holes', runCommand(commands.showHoles)],
    ['idris.add-clause', runCommand(commands.addClause)],
    ['idris.add-proof-clause', runCommand(commands.addProofClause)],
    ['idris.case-split', runCommand(commands.caseSplit)],
    ['idris.proof-search', runCommand(commands.proofSearch)],
    ['idris.make-with', runCommand(commands.makeWith)],
    ['idris.make-case', runCommand(commands.makeCase)],
    ['idris.make-lemma', runCommand(commands.makeLemma)],
    ['idris.apropos', runCommand(commands.apropos)],
    ['idris.eval-selection', runCommand(commands.evalSelection)],
    ['idris.start-refresh-repl', runCommand(commands.startREPL)],
    ['idris.send-selection-repl', runCommand(commands.sendREPL)],
    ['idris.cleanup-ibc', runCommand(cleanupIbc)],
    ['idris.new-project', newProject],
    ['idris.search', runCommand(commands.search)]
  ]
}

let cleanupIbc = (..._: {}[]): void => {
  common.getAllFiles('ibc').forEach((file) => {
    fs.unlinkSync(file)
  })
}

let newProject = (..._: {}[]): void => {
  vscode.window.showInputBox({ prompt: 'Project name' }).then(val => {
    let result = cp.spawnSync("idrin", ["new", val], { cwd: path.resolve(common.getSafeRoot(), "../") })
    if (result.status != 0) {
      if (result.stderr) {
        vscode.window.showErrorMessage(result.stderr.toString())
      } else {
        vscode.window.showErrorMessage("Please install idringen first")
      }
    } else {
      if (result.stdout)
        vscode.window.showInformationMessage(result.stdout.toString().split("\n")[1])
    }
  })
}

export let getCompilerOptsPromise = (): Rx.Observable<CompilerOptions> => {
  let compilerOptions = ipkg.compilerOptions(common.getSafeRoot())
  return compilerOptions
}

export let reInitialize = (): void => {
  getCompilerOptsPromise().subscribe((compilerOptions) => {
    commands.reInitialize(compilerOptions)
  })
}

export let withCompilerOptions = (callback: (uri: string) => void): void => {
  Maybe.of(vscode.window.activeTextEditor).map((editor) => {
    let document = editor.document
    if (!IDRIS_MODE.map((mode) => { return mode.language }).includes(document.languageId)) return
    let uri = document.uri.fsPath

    getCompilerOptsPromise().subscribe((compilerOptions) => {
      commands.initialize(compilerOptions)
      callback(uri)
    })
  })
}

export let typeCheckOnSave = (): void => {
  withCompilerOptions(commands.typecheckFile)
  commands.clearTotalityDiagnostics()
  if (vscode.workspace.getConfiguration('idris').get('warnPartial')) {
    withCompilerOptions(commands.buildIPKG)
    withCompilerOptions(commands.checkTotality)
  }
}

let runCommand = (command: (uri: string) => void): (..._: {}[]) => void => {
  return (_) => {
    withCompilerOptions(command)
  }
}

export const tcDiagnosticCollection = commands.tcDiagnosticCollection
export const buildDiagnosticCollection = commands.buildDiagnosticCollection
export const nonTotalDiagnosticCollection = commands.nonTotalDiagnosticCollection
