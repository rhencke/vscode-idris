let isString = function(s: any): boolean {
  return typeof s === 'string' || s instanceof String
}

let isSymbol = function(s: any): boolean {
  return isString(s) && s.length > 0 && s[0] === ':' && s.indexOf(' ') === -1
}

let isBoolean = function(s: any): boolean {
  return typeof s === 'boolean' || s instanceof Boolean
}

export let serialize = function(obj: sexp): string {
  let msg = formatSexp(obj) + '\n'
  return hexLength(msg) + msg
}

export let hexLength = function(str: string): string {
  let hex = str.length.toString(16)
  return Array(7 - hex.length).join('0') + hex
}

export let formatSexp = function(sexp: sexp): string {
  if (sexp instanceof Array) {
    return '(' + sexp.map(formatSexp).join(' ') + ')'
  } else if (isSymbol(sexp)) {
    return sexp as string
  } else if (isString(sexp)) {
    return '"' + (sexp as string).trim() + '"'
  } else if (isBoolean(sexp)) {
    if (sexp) {
      return ':True'
    } else {
      return ':False'
    }
  } else {
    return sexp.toString()
  }
}

type sexp = string | number | boolean | list
interface list extends Array<sexp> { }
