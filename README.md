# purpose

This extension is stil in development. It's meant as a support for working with the Lit-HTML framework in combination
with javascript. together with the extension "lit-html" and "lit-plugin" it's meant to increase the type-safety for
javascript code in combination with web-components. using those two plugins the only two risks for said topic are:

-   component attributes having only simple types like Object, Array, String, Number, Boolean
-   component event types not being inferred to the javascript binding (`(e) => { ... }` e being any type)

# solution

## complex component attribute types

As there happens to be a problem with typescript supporting advanced type checks (`typeof`), this plugin runs a check on
all files on the system, subscribing on file changes. it checks both the component attribute definition type and parses
the value type using typescript libraries. afterwards it compares the string of both values. This should work both for
primitive types, for exact type names and for anonymous object.

## event type detection

it is literally impossible to add additional types, both to typescript checks as well as to vscode inferred language
types. as a measure against this problem this extension is enriching all UI-APIs the IDE is providing (hover,
autocomplete, navigation, ...). As a base for the new result this extension uses typescript, invisible updating the
source file with the inferred event type from the component as JSDOC.

However, there are limits on how far this approach can go, so the warning developers get with "noImplicitAny" cannot be
suppressed. as a measurement this extension will have a custom "noImplicitAny" rule and detect it through the workspace.
Using typescript libraries as a base.

## Disclaimer

This extensions is not a professional vscode extension. I don't guarantee any kind of working experience. Development
might stagnate. Bugs might not be fixed anytime soon, this extension itself might disappear. Don't expect anything from
it.
