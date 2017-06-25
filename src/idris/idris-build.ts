import IdrisProcessBase from './idris-process-base'

export default class IdrisBuild extends IdrisProcessBase {
  constructor(ipkgFile: string) {
    super(["--build", ipkgFile], true)
  }

  stdout(data: string) {
    this.emit('message', data)
  }
}
