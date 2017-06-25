// Contains type definitions used throughout the codebase.

/** The set of types that can be formatted as an S-Expression for Idris's IDE protocol */
type sexp = string | number | boolean | list

/** An array of values that can be formatted as an S-Expression for Idris's IDE protocol */
interface list extends Array<sexp> { }

interface response<T> {
  responseType: string
  msg: T
}

interface ideVersion {
  /** Version number in list format, e.g., [major, minor] */
  [0]: number[]
  /** Mysterious extra empty list with unknown purpose? */
  [1]: list
}

interface ideDoc {
  /** An identifier and its type signature. */
  [0]: string
  /** A set of descriptions for the identifier and type signature, in the form of text ranges and metadata. */
  [1]: ideRangeDescription[]
}

/** A response from Idris's IDE protocol when queried with :browse-namespace */
interface ideBrowseNamespace {
  /** An array with this as its only value for some reason. */
  [0]: ideBrowseNamespaceInner
}

interface ideBrowseNamespaceInner {
  /** A list of namespaces available beneath this namespace. */
  [0]: string[],
  /** A list of names available in this namespace, and their descriptions. */
  [1]: ideDoc[]
}

/** A description of a range of text comprised of the start character position, the end character position, and an array of metadata that applies to said range. */
interface ideRangeDescription {
  /** The starting character position of the text range */
  [0]: number
  /** The ending character position of the text range */
  [1]: number
  /** A set of metadata describing this range */
  [2]: ideMetadata[]
}

/** An array of key-value pairs, each in the form [":key", "value"].  The value may be any type. */
interface ideMetadata {
  /** The key identifying this property.
   * @see http://docs.idris-lang.org/en/latest/reference/ide-protocol.html#output-highlighting
   */
  [0]: string,
  /** The value of this property.
   * @see http://docs.idris-lang.org/en/latest/reference/ide-protocol.html#output-highlighting
   */
  [1]: sexp
}

interface CompilerOptions {
  options?: string
  pkgs?: string[]
  src?: string
}

interface String {
  // String.prototype.trimLeft() documentation by Mozilla Contributors is licensed under CC-BY-SA 2.5.
  // String.prototype.trimLeft() documentation: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/TrimLeft
  // Mozilla Contributors: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/TrimLeft$history
  // CC-BY-SA 2.5: https://creativecommons.org/licenses/by-sa/2.5/
  /** Removes whitespace from the left end of a string.
   * @returns A new string representing the calling string stripped of whitespace from its left end.
   */
  trimLeft(): string
}
