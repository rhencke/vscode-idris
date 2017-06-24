import * as path from 'path'
import * as fs   from 'fs'
import * as Rx   from 'rx-lite'

let optionsRegexp   = /opts\s*=\s*\"([^\"]*)\"/
let sourcedirRegexp = /sourcedir\s*=\s*([a-zA-Z\/0-9.]+)/
let pkgsRegexp      = /pkgs\s*=\s*([a-zA-Z\/0-9., ]+)/

// coax TypeScript into picking the right overloads
let rxReaddir: (path: string | Buffer, callback: (err: NodeJS.ErrnoException, files: string[]) => void) => void = fs.readdir
let rxReadFile: (filename: string, options: { encoding: string; flag?: string; }, callback: (err: NodeJS.ErrnoException, data: string) => void) => void = fs.readFile

interface FileInfo {
  file: string
  directory: string
  path: string
  ext: string
}

export let findIpkgFile = (directory: string): Rx.Observable<FileInfo[]> => {
  let readDir = Rx.Observable.fromNodeCallback(rxReaddir)
  let r = readDir(directory)
  return r.map((files) => {
    return files.map((file) => {
      return {
        file: file,
        directory: directory,
        path: path.join(directory, file),
        ext: path.extname(file)
      }
    }).filter((file) => {
      return file.ext === '.ipkg'
    })
  })
}

interface CompilerOptions {
  options?: string
  pkgs: string[]
  src: string
}

let parseIpkgFile = (fileInfo: FileInfo): ((fileContents: string) => CompilerOptions) => {
  return (fileContents) => {
    let optionsMatches = fileContents.match(optionsRegexp)
    let sourcedirMatches = fileContents.match(sourcedirRegexp)
    let pkgsMatches = fileContents.match(pkgsRegexp)
    let compilerOptions: any = {}
    if (optionsMatches) {
      compilerOptions.options = optionsMatches[1]
    }
    compilerOptions.pkgs = pkgsMatches ? pkgsMatches[1].split(',').map((s) => {
      return s.trim()
    }) : []
    compilerOptions.src = sourcedirMatches ? path.join(fileInfo.directory, sourcedirMatches[1]) : fileInfo.directory
    return compilerOptions
  }
}

let readIpkgFile = (ipkgFile: FileInfo): Rx.Observable<string> => {
  let readFile = Rx.Observable.fromNodeCallback(rxReadFile)
  return readFile(ipkgFile.path, {
    encoding: 'utf8'
  })
}

export let compilerOptions = (directory: string): Rx.Observable<CompilerOptions|any> => {
  let ipkgFilesObserver = findIpkgFile(directory)
  return ipkgFilesObserver.flatMap((ipkgFiles) => {
    if (ipkgFiles.length) {
      let ipkgFile = ipkgFiles[0]
      return readIpkgFile(ipkgFile).map(parseIpkgFile(ipkgFile))
    } else {
      return Rx.Observable["return"]({})
    }
  })["catch"](() => {
    return Rx.Observable["return"]({})
  })
}

export let getPkgOpts = (compilerOptions: CompilerOptions): string => {
  let pkgs = compilerOptions.pkgs && compilerOptions.pkgs.length
    ? [].concat.apply([], compilerOptions.pkgs.map((p) => {
      return ["-p", p]
    }))
    : []

  let pkgOpts = pkgs.concat(compilerOptions.options ? compilerOptions.options.split(' ') : [])
  return pkgOpts
}
