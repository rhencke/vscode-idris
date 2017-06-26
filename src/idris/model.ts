import IdrisIdeMode from './ide-mode'
import IdrisBuild from './idris-build'
import * as Rx from 'rx-lite'
import * as path from 'path'

export default class IdrisModel {
  requestId = 0
  ideModeRef: IdrisIdeMode = null
  idrisBuildRef: IdrisBuild = null
  idrisReplRef: any = null
  subjects: {[index:number]: Rx.Subject<ideResponse<sexp>>} = {}
  warnings: {[index:number]: ideWarningSexp[]} = {}
  idrisBuildSubject: Rx.Subject<string> = null
  idrisReplSubject: any = null
  compilerOptions: CompilerOptions = {}

  constructor() {
  }

  ideMode(compilerOptions: CompilerOptions): IdrisIdeMode {
    // Stop and nullify ideModeRef if it is already running but with
    // outdated options, so that it can be restarted.
    if (!this.ideModeRef) {
      this.ideModeRef = new IdrisIdeMode()
      this.ideModeRef.on('message', (obj: list) => { this.handleIdeModeCommand(obj) })
      this.ideModeRef.start(compilerOptions)
    }
    return this.ideModeRef
  }

  idrisBuild(compilerOptions: CompilerOptions, ipkgFile: string): IdrisBuild {
    this.idrisBuildRef = new IdrisBuild(ipkgFile)
    this.idrisBuildRef.on('message', (obj) => { this.handleIdrisBuildMessage(obj) })
    this.idrisBuildRef.start(compilerOptions)
    return this.idrisBuildRef
  }

  stop(): void {
    if (this.ideModeRef)
      this.ideModeRef.stop()
    if (this.idrisReplRef)
      this.idrisReplRef.stop()
  }

  setCompilerOptions(options: CompilerOptions) {
    this.compilerOptions = options
  }

  prepareCommand(cmd: [':apropos', string]): Rx.Subject<ideDocResponse>
  prepareCommand(cmd: [':add-clause', number, string]): Rx.Subject<ideAddClauseResponse>
  prepareCommand(cmd: [':add-proof-clause', number, string]): Rx.Subject<ideResponse<sexp>> /* todo */
  prepareCommand(cmd: [':repl-completions', string]): Rx.Subject<ideResponse<sexp>> /* todo */
  prepareCommand(cmd: [':browse-namespace', string]): Rx.Subject<ideBrowseNamespaceResponse>
  prepareCommand(cmd: [':case-split', number, string]): Rx.Subject<ideCaseSplitResponse>
  prepareCommand(cmd: [':docs-for', string]): Rx.Subject<ideDocResponse>
  prepareCommand(cmd: [':interpret', string]): Rx.Subject<ideDocResponse>
  prepareCommand(cmd: [':load-file', string]): Rx.Subject<ideResponse<list>> /* empty list response */
  prepareCommand(cmd: [':make-case', number, string]): Rx.Subject<ideMakeCaseResponse>
  prepareCommand(cmd: [':make-lemma', number, string]): Rx.Subject<ideMakeLemmaResponse>
  prepareCommand(cmd: [':make-with', number, string]): Rx.Subject<ideMakeWithResponse>
  prepareCommand(cmd: [':metavariables', number]): Rx.Subject<ideMetavariablesResponse>
  prepareCommand(cmd: [':print-definition', string]): Rx.Subject<ideDocResponse>
  prepareCommand(cmd: [':proof-search', number, string, list]): Rx.Subject<ideProofSearchResponse>
  prepareCommand(cmd: [':type-of', string]): Rx.Subject<ideDocResponse>
  prepareCommand(cmd: ':version'): Rx.Subject<ideVersionResponse>
  prepareCommand<T extends sexp>(cmd: sexp): Rx.Subject<ideResponse<T>> {
    let id = this.getUID()
    let subject = new Rx.Subject<ideResponse<T>>()
    this.subjects[id] = subject
    this.warnings[id] = []
    this.ideMode(this.compilerOptions).send([cmd, id])
    return subject
  }

  getUID(): number {
    return ++this.requestId
  }

  handleIdrisBuildMessage(msg: string): void {
    this.idrisBuildSubject.onNext(msg)
  }

  handleIdeModeCommand(cmd: list): void {
    if (cmd.length > 0) {
      let op = cmd[0]
      let params = cmd.slice(1, cmd.length - 1)
      let id = cmd[cmd.length - 1] as number
      if (this.subjects[id] != null) {
        let subject = this.subjects[id]
        switch (op) {
          case ':return':
            let ret = params[0] as list
            if (ret[0] === ':ok') {
              let okparams = ret[1] as list
              if (okparams[0] === ':metavariable-lemma') {
                subject.onNext({
                  responseType: 'return',
                  msg: okparams
                })
              } else {
                subject.onNext({
                  responseType: 'return',
                  msg: ret.slice(1)
                })
              }
            } else {
              subject.onError({
                message: ret[1],
                warnings: this.warnings[id],
                highlightInformation: ret[2],
                cwd: this.compilerOptions.src
              })
            }
            subject.onCompleted()
            delete this.subjects[id]
            break
          case ':write-string':
            let msg = params[0]
            subject.onNext({
              responseType: 'write-string',
              msg: msg
            })
            break
          case ':warning':
            let warning = params[0] as ideWarningSexp
            this.warnings[id].push(warning)
            break
          case ':set-prompt':
            break
        }
      }
    }
  }

  changeDirectory(dir: string): Rx.Subject<ideResponse<sexp>> {
    return this.interpret(`:cd ${dir}`)
  }

  getDirectory(uri: string): string {
    if (this.compilerOptions && this.compilerOptions.src) {
      return this.compilerOptions.src
    } else {
      return path.dirname(uri)
    }
  }

  build(ipkgFile: string): Rx.Subject<string> {
    this.idrisBuildSubject = new Rx.Subject<string>()
    this.idrisBuild(this.compilerOptions, ipkgFile)
    return this.idrisBuildSubject
  }

  load(uri: string): Rx.Observable<ideResponse<list>> {
    let dir = this.getDirectory(uri)
    let cd

    if (dir != this.compilerOptions.src) {
      this.compilerOptions.src = dir
      cd = this.changeDirectory(dir).map((_) => {
        return dir
      })
    } else {
      cd = Rx.Observable.of(dir)
    }

    return cd.flatMap((_) => {
      return this.prepareCommand([':load-file', uri])
    })
  }

  getType(word: string): Rx.Subject<ideDocResponse> {
    return this.prepareCommand([':type-of', word])
  }

  getDocs(word: string): Rx.Subject<ideDocResponse> {
    return this.prepareCommand([':docs-for', word])
  }

  printDefinition(name: string): Rx.Subject<ideDocResponse> {
    return this.prepareCommand([':print-definition', name])
  }

  interpret(code: string): Rx.Subject<ideDocResponse> {
    return this.prepareCommand([':interpret', code])
  }

  getVersion(): Rx.Subject<ideVersionResponse> {
    return this.prepareCommand(':version')
  }

  holes(width: number): Rx.Subject<ideMetavariablesResponse> {
    return this.prepareCommand([':metavariables', width])
  }

  addClause(line: number, word: string): Rx.Subject<ideAddClauseResponse> {
    return this.prepareCommand([':add-clause', line, word])
  }

  addProofClause(line: number, word: string): Rx.Subject<ideResponse<sexp>> {
    return this.prepareCommand([':add-proof-clause', line, word])
  }

  caseSplit(line: number, word: string): Rx.Subject<ideCaseSplitResponse> {
    return this.prepareCommand([':case-split', line, word])
  }

  proofSearch(line: number, word: string): Rx.Subject<ideProofSearchResponse> {
    return this.prepareCommand([':proof-search', line, word, []])
  }

  makeWith(line: number, word: string): Rx.Subject<ideMakeWithResponse> {
    return this.prepareCommand([':make-with', line, word])
  }

  makeLemma(line: number, word: string): Rx.Subject<ideResponse<sexp>> {
    return this.prepareCommand([':make-lemma', line, word])
  }

  makeCase(line: number, word: string): Rx.Subject<ideMakeCaseResponse> {
    return this.prepareCommand([':make-case', line, word])
  }

  apropos(name: string): Rx.Subject<ideResponse<sexp>> {
    return this.prepareCommand([':apropos', name])
  }

  replCompletions(word: string): Rx.Subject<ideResponse<sexp>> {
    return this.prepareCommand([':repl-completions', word])
  }

  browseNamespace(moduleName: string) {
    return this.prepareCommand([':browse-namespace', moduleName])
  }
}
