# humanist

A specification and parser for command line options, with a focus on ease of typing on PCs and mobiles. When using humanist to parse command line options, it is recommended to stay close to natural language. That would make humanist-based syntax a good fit for communicating with bots.

## What does it look like?

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

While defining the reminder app's options, specify that the option 'due' takes a single argument, and that the option 'todo' takes an arbitrary number of arguments.

```javascript
const options = [["due", 1], ["todo", Infinity]];
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

Humanist uses the period character '.' as a delimiter to separate multi-word options.

```bash
send to alice bob carol. text Hello, world
```

```javascript
const options = [["to", Infinity], ["text", Infinity]];

/* Prints:
{
  to: ["alice", "bob", "carol"],
  text: ["Hello,", "world"]
}
*/
console.log(parser("to alice bob carol. text Hello, world"));
```

### Argument-less options aka Flags

A flag is a boolean which indicates whether an option has been specified. It takes no arguments, so the argument count should be set to zero.

Here's an example, with a flag called 'privately'.

```bash
send privately to alice bob carol. text Hey, ssup?
```

Humanist parses flags as booleans.

```javascript
const options = [
  ["to", Infinity],
  ["text", Infinity],
  ["privately", 0] // means it's a flag
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
const options = [["due", 1], ["todo", Infinity, { join: true }]];
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

Options may be repeated in the command line to provide an array of values. In the following example the option 'todo' is repeated thrice, so its value will be an array of strings.

```bash
tasks due tomorrow todo Get Milk. todo Wash clothes. todo Buy shuttles.
```

```javascript
const options = [["due", 1], ["todo", Infinity, { join: true }]];
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

Similarly repeating flags will result in an array of booleans.

### Escaping the period

There will be many situations where the period is a valid value for an option.

```bash
book title Don Quixote. Moby Dick. 
```

There may be cases where you need to accept 'K.' as an valid option, but humanist will mistake it for a delimiter. To escape a 'K.' from being treated as a delimiter, simply say 'KK.'. And if you had to say 'KK.', you'll need to type 'KKK.' and so forth.

```javascript
const options = [["alphabets", Infinity, { join: true }], ["position", 1]];
const parser = humanist(options);

/* Prints:
{
  alphabets: "E. F. G. H. I. J. K. L.",
  position: "left"
}
*/
console.log(parser("alphabets E. F. G. H. I. J. KK. L. K. position left"));
```

### Unmatched args at the end of the sentence

Humanist captures the list of unmatched arguments as the underscore property.

```javascript
const options = [["to", Infinity]];
const parser = humanist(options);

/* Prints:
  {
    to: ["alice", "bob", "carol"],
    _: ["Hello,", "world."]
  }
*/
console.log(parser("to alice bob carol. Hello, world."));
```
