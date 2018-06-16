# humanist

A specification and parser for command line options, with a focus on ease of typing on PCs and mobiles. When using humanist to parse command line options, it is recommended to stay close to natural language. That would make humanist-based syntax a good fit for communicating with bots from PCs and phones.

Humanist commands make extensive use of the period to separate options since it's the symbol that's easiest to type across keyboards. On Android and iOS keyboards you can get a period by typing space twice.

## Alright, what does it look like?

Assuming there's app called 'reminder', the command line might look like:

```bash
reminder due tomorrow todo Get two bottles of milk
```

Or with a messaging app called 'imessage':

```bash
imessage to alice bob carol. text Hello, world.
```

Options are not case-sensitive. These two are the same.

```bash
imessage to alice bob carol. text Hello, world.
imessage To alice bob carol. Text Hello, world.
```

## Installation

```bash
npm i humanist
```

## Basic grammar and options

Let's consider the first example:

```bash
reminder due tomorrow todo Get two bottles of milk
```

While defining the reminder app's options, specify that the option 'due' takes a single word as the argument, and that the option 'todo' takes multiple words (an arbitrary number of arguments).

```javascript
const options = [["due", "single"], ["todo", "multi"]];
const parser = humanist(options);

/* Prints:
{
  due: "tomorrow",
  todo: ["Get", "two", "bottles", "of, "milk"]
}
*/
console.log(parser("due tomorrow todo Get two bottles of milk"));

/*
  Passing an array of words yields the same result.
  With nodejs, you can pass the command line param array.
*/
console.log(
  parser(["due", "tomorrow", "todo", "Get", "two", "bottles", "of", "milk"])
);
```

### Multiple options of arbitrary length (Delimiters)

Humanist uses the period character '.' as a delimiter to separate options which take multiple args.

```bash
send to alice bob carol. text Hello, world
```

```javascript
const options = [["to", "multi"], ["text", "multi"]];

/* Prints:
{
  to: ["alice", "bob", "carol"],
  text: ["Hello,", "world"]
}
*/
console.log(parser("to alice bob carol. text Hello, world"));
```

### Argument-less options aka Flags

A flag is a boolean which indicates whether an option has been mentioned in the command input.

Here's an example, with a flag called 'privately'.

```bash
send privately to alice bob carol. text Hey, ssup?
```

Humanist parses flags as booleans.

```javascript
const options = [
  ["to", "multi"],
  ["text", "multi"],
  ["privately", "flag"] // means it's a flag
];

/* Prints:
{
  to: ["alice", "bob", "carol"],
  text: ["Hey,", "ssup?"],
  privately: true
}
*/
console.log(parser("privately to alice bob carol. text Hey, ssup?"));
```

### Join arguments

Sometimes we want to join the resultant array of arguments into a string. In the following example, the todo arguments are joined into "Get two bottles of milk" instead of ["Get", "two", "bottles", "of, "milk"].

```javascript
const options = [["due", "single"], ["todo", "multi", { join: true }]];
const parser = humanist(options);

/* Prints:
{
  due: "tomorrow",
  todo: "Get two bottles of milk"
}
*/
console.log(parser("due tomorrow todo Get two bottles of milk"));
```

### Repeating options

With the 'multiple' setting, options may be repeated in the command line to provide an array of values. In the following example the option 'todo' is repeated thrice, so its value will be an array of strings.

```bash
tasks due tomorrow todo Get Milk. todo Wash clothes. todo Buy shuttles.
```

```javascript
const options = [["due", "single"], ["todo", "multi", { join: true }]];
const parser = humanist(options);

/* Prints:
{
  due: "tomorrow",
  todo: ["Get Milk", "Wash clothes", "Buy shuttles"]
}
*/
console.log(
  parser("due tomorrow todo Get Milk. todo Wash clothes. todo Buy shuttles.")
);
```

### Literal strings

Sometimes it's necessary to accept full sentences or paragraphs as input, which may contain multiple periods in them. To specify a literal, add a period to the name of the option and end it with a 'k.' or 'K.'. The 'k.' is not necessary at the end of the sentence.

```bash
send to alice bob carol. text. Hey. When are you coming? I am home till 8. K. Send now
```

Notice the period after 'text' and the 'K.'. Everything in between is taken literally as a string.

```javascript
const options = [["to", "multi"], ["text", "multi"], ["send", "single"]];

/* Prints:
{
  to: ["alice", "bob", "carol"],
  text: "Hey. When are you coming? I am home till 8.",
  send: "now"
}
*/
console.log(
  parser(
    "to alice bob carol. text. Hey. When are you coming? I am home till 8. K. Send now"
  )
);
```

### Escaping the K.

There may be cases where you need to accept 'K.' as an valid option, but humanist will mistake it for a delimiter. To escape a 'K.' from being treated as a delimiter, simply say 'KK.'. And if you had to say 'KK.', you'll need to type 'KKK.' and so forth.

```javascript
/* Prints:
{
  alphabets: "E. F. G. H. I. J. K. L.",
  position: "left"
}
*/
console.log(parser("alphabets. E. F. G. H. I. J. KK. L. K. position left"));
```

### Unmatched args at the end of the sentence

Humanist captures the list of unmatched arguments as the underscore property.

```javascript
const options = [["to", "multi"]];
const parser = humanist(options);

/* Prints:
  {
    to: ["alice", "bob", "carol"],
    _: ["Hello,", "world."]
  }
*/
console.log(parser("to alice bob carol. Hello, world."));
```

### Custom Handling (Advanced)

Humanist allows custom parsing logic to be added via a callback.
In the following example, the custom parser handled account names starting with '@'. The options parsed so far are available in the parameter named 'current'.

```js
interface IResult {
  _: string[];
  [key: string]: boolean | string | string[];
}

function parse(arg: string, index: number, args: string[], current: IResult) {
  // If it starts with an '@' it's an account name
  if (/^@/.test(arg)) {
    const nextIndex = index + 1;
    const newResult = { ...current, account: arg.substring(1) };
    return [nextIndex, newResult];
  }
}

const options = [["email", "single"], ["file", "multi"]];
const parser = humanist(options);

/* Prints:
  {
    account: "@scuttlespace",
    email: "hello@scuttle.space",
    file: ["a.txt", "b.txt"]
  }
*/
console.log(parser("@scuttlespace email hello@scuttle.space file a.txt b.txt"));
```
