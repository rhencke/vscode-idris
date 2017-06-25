import * as ipkg from '../ipkg/ipkg'
import * as cp from 'child_process'
import { EventEmitter } from 'events'
import * as vscode from 'vscode'

export default class IdrisProcessBase extends EventEmitter {
  process: cp.ChildProcess
  buffer: string
  labels: string[]
  isBuild: boolean

  constructor(labels: string[], isBuild: boolean) {
    super()
    this.process = null
    this.buffer = ''
    this.labels = labels
    this.isBuild = isBuild
  }

  start(compilerOptions: CompilerOptions): void {
    if ((this.process == null) || !this.process.connected) {
      let pathToIdris = vscode.workspace.getConfiguration('idris').get<string>('executablePath')

      let params = this.isBuild ? this.labels : this.labels.concat(ipkg.getPkgOpts(compilerOptions))
      let options = compilerOptions.src ? {
        cwd: this.isBuild ? vscode.workspace.rootPath : compilerOptions.src
      } : {}

      this.process = cp.spawn(pathToIdris, params, options)

      if (!this.isBuild) {
        this.process.on('error', this.error)
        this.process.on('exit', this.exited)
        this.process.on('close', this.exited)
        this.process.on('disconnect', this.exited)
      }

      if (this.process.pid) {
        this.process.stdout.setEncoding('utf8').on('data', (data) => { this.stdout(data) })
      }
    }
  }

  stop(): void {
    if (this.process != null) {
      this.process.removeAllListeners()
      this.process.kill()
      this.process = null
    }
  }

  error(error: NodeJS.ErrnoException): void {
    let msg = error.code == 'ENOENT'
      ? "Couldn't find idris executable at \"" + error.path + "\""
      : error.message + '(' + error.code + ')'
    vscode.window.showErrorMessage(msg)
  }

  exited(code: number, signal: string): void {
    if (signal == "SIGTERM") {
      let msg = "The idris compiler was closed"
      console.info(msg)
    } else {
      let short = "The idris compiler was closed or crashed"
      let long = signal
        ? "It was closed with the signal: " + signal
        : "It (probably) crashed with the error code: " + code
      vscode.window.showErrorMessage(short + " " + long)
    }
  }

  send(cmd: string): void {
    console.info(`send command: ${cmd}`)
  }

  stdout(data: string|Buffer): void {
    console.info(`on data: ${data}`)
  }
}
