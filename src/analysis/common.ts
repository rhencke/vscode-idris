import * as fs from "fs";
import * as glob from "glob";
import * as _ from "lodash";
import * as vscode from "vscode";
import Maybe from "../maybe"

export interface Definition {
  path: string
  module: string
  line: string
  column: string
}

export const idrisKeywords = [
  "if",
  "then",
  "else",
  "do",
  "let",
  "in",
  "dsl",
  "impossible",
  "case",
  "of",
  "total",
  "partial",
  "mutual",
  "infix",
  "infixl",
  "infixr",
  "constructor",
  "where",
  "with",
  "syntax",
  "proof",
  "postulate",
  "using",
  "namespace",
  "rewrite",
  "public",
  "private",
  "export",
  "implicit",
  "module",
  "import",
  "auto",
  "default",
  "data",
  "codata",
  "class",
  "instance",
  "interface",
  "implementation",
  "record",
  "Type",
  "Int",
  "Nat",
  "Integer",
  "Float",
  "Char",
  "String",
  "Ptr",
  "Bits8",
  "Bits16",
  "Bits32",
  "Bits64",
  "Bool",
  "_",
  "True",
  "False",
  "Just",
  "Nothing"
]

// https://github.com/idris-lang/Idris-dev/blob/master/src/Idris/Package/Parser.hs
export let ipkgKeywords = [
  "package",
  "executable",
  "main",
  "sourcedir",
  "opts",
  "pkgs",
  "modules",
  "libs",
  "objs",
  "makefile",
  "tests",
  "version",
  "readme",
  "license",
  "homepage",
  "sourceloc",
  "bugtracker",
  "brief",
  "author",
  "maintainer"
]

export let getImportPattern = () => {
  return /import\s+(public\s+)?(([A-Z]\w*)(\.[A-Z]\w*)*)(\s+as\s+(\w+))?[\r\n|\n]/g
}

export let getAllIdents = () => {
  let files = getAllFilesExts(['idr', 'lidr'])
  let defList = files.map((uri: string) => {
    return getIdents(uri).filter((name: string) => {
      return !/\b\d+\b/g.test(name) && !idrisKeywords.includes(name)
    }).map((name) => {
      return { name, uri }
    })
  })
  let uniIdents = _.uniqWith(_.flatten(defList), _.isEqual)
  return uniIdents
}

let identRegex = /'?[a-zA-Z0-9_][a-zA-Z0-9_-]*'?/g
let identMatch
let identList

export let getIdents = (uri: string) => {
  identList = []

  let content = fs.readFileSync(uri).toString()
  while (identMatch = identRegex.exec(content)) {
    let ident = identMatch[0]
    if (identList.indexOf(ident) <= -1) {
      identList.push(ident)
    }
  }
  return identList
}

export let getAllPositions = (name: string, uri: string) => {
  let positions = []
  let content = fs.readFileSync(uri).toString()
  let contents = content.split("\n")
  let regex = name.endsWith("'") ? new RegExp(`\\b${name}`, "g") : new RegExp(`\\b${name}\\b`, "g")
  let match
  for (let i = 0; i < contents.length; i++) {
    let current = contents[i]
    while (match = regex.exec(current)) {
      let line = i
      let column = match.index
      if (!name.endsWith("'")) {
        if (!(current.slice(column + 1, column + 2) == "'")) {
          positions.push({ uri, line, column })
        }
      } else {
        positions.push({ uri, line, column })
      }
    }
  }
  return positions
}

export let getModuleName = (uri: string) => {
  let content = fs.readFileSync(uri).toString()
  let modulePattern = /\bmodule(.*)\s+/g
  let moduleMatch = modulePattern.exec(content)
  return moduleMatch ? moduleMatch[1].trim() : null
}

export let getAllModuleName = () => {
  let files = getAllFilesExts(['idr', 'lidr'])
  let moduleNames = files.map((uri: string) => {
    return getModuleName(uri)
  })
  return _.uniqWith(moduleNames, _.isEqual)
}

export let getImportedModules = (uri: string) => {
  let content = fs.readFileSync(uri).toString()
  let importPattern = getImportPattern()
  let match
  let importedModules = []
  while (match = importPattern.exec(content)) {
    importedModules.push(match[2].trim())
  }
  return importedModules
}

export let getImportedModuleAndAlias = (uri: string) => {
  let content = fs.readFileSync(uri).toString()
  let importPattern = getImportPattern()
  let match
  let importedModules = []
  while (match = importPattern.exec(content)) {
    let moduleName = match[2].trim()
    if (match[6] != undefined) {
      let aliasName = match[6].trim()
      importedModules.push({ moduleName, aliasName })
    }
  }
  return importedModules
}

export let isDefinitonEqual = (def1: Definition, def2: Definition) => {
  return def1.path == def2.path
    && def1.module == def2.module
    && def1.line == def2.line
    && def1.column == def2.column
}

export let getSafeRoot = () => {
  let root = vscode.workspace.rootPath
  let safeRoot = root === undefined ? "" : root
  return safeRoot
}

export let getAllFiles = (ext: string) => {
  if (!_.isEmpty(getSafeRoot())) {
    let files = glob.sync(getSafeRoot() + "/**/*")
    return files.filter((file) => {
      return file.endsWith(`.${ext}`)
    })
  } else {
    return Maybe.of(vscode.window.activeTextEditor)
      .map((editor) => { return editor.document.uri.fsPath })
      .map((uri) => { return uri.endsWith(ext) ? [uri] : [] })
      .getOrElse([])
  }
}

export let getAllFilesExts = (exts: string[]) => {
  let filess = exts.map((ext) => {
    return getAllFiles(ext)
  })
  return _.flatten(filess)
}
