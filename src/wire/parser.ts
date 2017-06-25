const jison = require('jison')

const parser = new jison.Parser(`
%lex
%x STRING
%%
\s+                    /* Whitespace */
[0-9]+                 return 'Number'
\:[a-zA-Z]+            return 'Atom'
\(                     return '('
\)                     return ')'

\"                     yy.lexer.begin('STRING'); yy.buf = ''
<STRING>[^\\\"]        yy.buf += yytext
<STRING>\\[\\\"]       yy.buf += yytext[1]
<STRING>\"             yytext = yy.buf; yy.lexer.popState(); return 'String'

<<EOF>>                return 'EOF'
/lex

%%

begin: expr EOF { return $1; };

exprs: { $$ = [] }
     | exprs expr  { $1.push($2); $$ = $1 }
     ;

expr: String
    | Atom
    | Number { $$ = parseInt($1, 10) }
    | '(' exprs ')' { $$ = $2 }
    ;
`);

export function parse(input: string) {
  return parser.parse(input)
}
