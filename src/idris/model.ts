import IdrisIdeMode from './ide-mode'
import IdrisBuild from './idris-build'
import * as Rx from 'rx-lite'
import * as path from 'path'

export default class IdrisModel {
  requestId = 0
  ideModeRef: IdrisIdeMode = null
  idrisBuildRef: IdrisBuild = null
  idrisReplRef: any = null
  subjects: {[index:number]: Rx.Subject<response<sexp>>} = {}
  warnings: {[index:number]: Array<any>} = {}
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
      this.ideModeRef.on('message', (obj) => { this.handleIdeModeCommand(obj) })
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

  prepareCommand(cmd: [':proof-search', number, string, list]): Rx.Subject<response<sexp>> /* todo */
  prepareCommand(cmd: [':add-clause' | ':add-proof-clause' | ':case-split' | ':make-with' | ':make-lemma' | ':make-case', number, string]): Rx.Subject<response<sexp>> /* todo */
  prepareCommand(cmd: ':version'): Rx.Subject<response<ideVersion>> /* todo */
  prepareCommand(cmd: [':interpret' | ':apropos' | ':repl-completions', string]): Rx.Subject<response<sexp>> /* todo */
  prepareCommand(cmd: [':metavariables', number]): Rx.Subject<response<sexp>> /* todo */
  prepareCommand(cmd: [':load-file', string]): Rx.Subject<response<list>> /* empty list response */
  prepareCommand(cmd: [':type-of' | ':docs-for' | ':print-definition', string]): Rx.Subject<response<ideDoc>>
  prepareCommand(cmd: [':browse-namespace', string]): Rx.Subject<response<ideBrowseNamespace>>
  prepareCommand<T extends sexp>(cmd: sexp): Rx.Subject<response<T>> {
    let id = this.getUID()
    let subject = new Rx.Subject<response<T>>()
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
            let warning = params[0]
            this.warnings[id].push(warning)
            break
          case ':set-prompt':
            break
        }
      }
    }
  }

  changeDirectory(dir: string): Rx.Subject<response<sexp>> {
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

  load(uri: string): Rx.Observable<response<list>> {
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

  getType(word: string): Rx.Subject<response<ideDoc>> {
    return this.prepareCommand([':type-of', word])
  }

  getDocs(word: string): Rx.Subject<response<ideDoc>> {
    return this.prepareCommand([':docs-for', word])
  }

  printDefinition(name: string): Rx.Subject<response<ideDoc>> {
    return this.prepareCommand([':print-definition', name])
  }

  interpret(code: string): Rx.Subject<response<sexp>> {
    return this.prepareCommand([':interpret', code])
  }

  getVersion(): Rx.Subject<response<ideVersion>> {
    return this.prepareCommand(':version')
  }

  holes(width: number): Rx.Subject<response<sexp>> {
    return this.prepareCommand([':metavariables', width])
  }

  addClause(line: number, word: string): Rx.Subject<response<sexp>> {
    return this.prepareCommand([':add-clause', line, word])
  }

  addProofClause(line: number, word: string): Rx.Subject<response<sexp>> {
    return this.prepareCommand([':add-proof-clause', line, word])
  }

  caseSplit(line: number, word: string): Rx.Subject<response<sexp>> {
    return this.prepareCommand([':case-split', line, word])
  }

  proofSearch(line: number, word: string): Rx.Subject<response<sexp>> {
    return this.prepareCommand([':proof-search', line, word, []])
  }

  makeWith(line: number, word: string): Rx.Subject<response<sexp>> {
    return this.prepareCommand([':make-with', line, word])
  }

  makeLemma(line: number, word: string): Rx.Subject<response<sexp>> {
    return this.prepareCommand([':make-lemma', line, word])
  }

  makeCase(line: number, word: string): Rx.Subject<response<sexp>> {
    return this.prepareCommand([':make-case', line, word])
  }

  apropos(name: string): Rx.Subject<response<sexp>> {
    return this.prepareCommand([':apropos', name])
  }

  replCompletions(word: string): Rx.Subject<response<sexp>> {
    return this.prepareCommand([':repl-completions', word])
  }

  browseNamespace(moduleName: string) {
    return this.prepareCommand([':browse-namespace', moduleName])
  }
}
