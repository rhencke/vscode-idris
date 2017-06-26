// Contains type definitions used throughout the codebase.

/** The set of types that can be formatted as an S-Expression for Idris's IDE protocol */
type sexp = string | number | boolean | list

/** An array of values that can be formatted as an S-Expression for Idris's IDE protocol */
interface list extends Array<sexp> { }

interface ideResponse<T> {
  responseType: string
  msg: T
}

interface ideError {
  message: string
  warnings?: ideWarningSexp[]
  highlightInformation: ideRangeDescriptionSexp[]
  cwd: string
}

interface ideWarningSexp extends list {
  /** The path to the file containing the warning. */
  [0]: string

  /** The starting line and column that the warning applies to. */
  [1]: ideTextPositionSexp

  /** The ending line and column that the warning applies to. */
  [2]: ideTextPositionSexp

  /** The warning message. */
  [3]: string

  /** A list of metadata describing the content of the warning message. */
  [4]: ideRangeDescriptionSexp[]
}

interface ideTextPositionSexp extends list {
  /** The line number. */
  [0]: number

  /** The column number within the line. */
  [1]: number
}

interface ideMakeLemmaResponse extends ideResponse<ideMakeLemmaSexp> {}
interface ideMakeLemmaSexp extends list {
  /** Always(?) the symbol :metavariable-lemma */
  [0]: ':metavariable-lemma';

  /** Information about the metavariable to replace. */
  [1]: ideReplaceMetavariableSexp

  /** Type information about the suggested replacement. */
  [2]: ideDefinitionTypeSexp
}

interface ideDefinitionTypeSexp extends list {
  /** Always(?) the symbol :definition-type */
  [0]: ':definition-type';

  /** An identifier and its type signature. */
  [1]: string
}

interface ideReplaceMetavariableSexp extends list {
  /** Always (?) the symbol :replace-metavariable */
  [0]: ':replace-metavariable';

  /** The metavariable to replace */
  [1]: string
}

interface ideMakeWithResponse extends ideResponse<ideMakeWithSexp> {}
interface ideMakeWithSexp extends list {
  /** A with-rule pattern match template for the clause of the function. */
  [0]: string
}

interface ideMakeCaseResponse extends ideResponse<ideMakeCaseSexp> {}
interface ideMakeCaseSexp extends list {
  /** A case pattern match template for the clause of the function. */
  [0]: string
}

interface ideProofSearchResponse extends ideResponse<ideProofSearchSexp> {}
interface ideProofSearchSexp extends list {
  /** The name of the hole for which a proof is being searched for, if found. */
  [0]: string
}

interface ideAddClauseResponse extends ideResponse<ideAddClauseSexp> {}
interface ideAddClauseSexp extends list {
  /** The initial pattern-match clause for the function declared. */
  [0]: string
}

interface ideCaseSplitResponse extends ideResponse<ideCaseSplitSexp> {}
interface ideCaseSplitSexp extends list {
  /** The pattern-match cases to be substituted. */
  [0]: string
}

interface ideVersionResponse extends ideResponse<ideVersionSexp> {}
interface ideVersionSexp extends list {
  /** An array with this as its only value for some reason. */
  [0]: ideVersionInnerSexp
}

interface ideVersionInnerSexp extends list {
  /** Version number in list format, e.g., [major, minor] */
  [0]: number[]
  /** Mysterious extra empty list with unknown purpose? */
  [1]: list
}

interface ideMetavariablesResponse extends ideResponse<ideMetavariablesSexp> {}
interface ideMetavariablesSexp extends list {
  /** An array of 'holes' with associated information. */
  [0]: ideMetavariableSexp[]
}

interface ideMetavariableSexp extends list {
  /** The qualified name of the metavariable. */
  [0]: string
  /** A list of premises for the metavariable. */
  [1]: idePremisesSexp[]
  /** A set of descriptions for the metavariable, in the form of text ranges and metadata. */
  [2]: ideRangeDescriptionSexp[]
}

interface idePremisesResponse extends ideResponse<idePremisesSexp> {}
interface idePremisesSexp extends list {
  /** name */
  [0]: string
  /** type */
  [1]: string
  /** ??? */
  [2]: any
}

interface ideDocResponse extends ideResponse<ideDocSexp> {}
interface ideDocSexp extends list {
  /** An identifier and its type signature. */
  [0]: string
  /** A set of descriptions for the identifier and type signature, in the form of text ranges and metadata. */
  [1]: ideRangeDescriptionSexp[]
}

/** A response from Idris's IDE protocol when queried with :browse-namespace */
interface ideBrowseNamespaceResponse extends ideResponse<ideBrowseNamespaceSexp> {}
interface ideBrowseNamespaceSexp extends list {
  /** An array with this as its only value for some reason. */
  [0]: ideBrowseNamespaceInnerSexp
}

interface ideBrowseNamespaceInnerSexp extends list {
  /** A list of namespaces available beneath this namespace. */
  [0]: string[],
  /** A list of names available in this namespace, and their descriptions. */
  [1]: ideDocSexp[]
}

/** A description of a range of text comprised of the start character position, the end character position, and an array of metadata that applies to said range. */
interface ideRangeDescriptionSexp extends list {
  /** The starting character position of the text range */
  [0]: number
  /** The ending character position of the text range */
  [1]: number
  /** A set of metadata describing this range */
  [2]: ideMetadata[]
}

/** An array of key-value pairs, each in the form [":key", "value"].  The value may be any type. */
interface ideMetadata extends list {
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
