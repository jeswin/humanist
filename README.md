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
```

### Multiple options of arbitrary length (Delimiters)

Periods can be used as delimiters anywhere in the sentence. A trailing period is not considered a delimiter.

```bash
send to alice bob carol. text Hello, world.
```

```javascript
const options = [["to", Infinity], ["text", Infinity]];

/* Prints:
{
  to: ["alice", "bob", "carol"],
  text: ["Hello,", "world."]
}
*/
console.log(parser("to alice bob carol. text Hello, world."));
```

### Argument-less options aka Flags

A flag is a boolean which indicates whether an option has been specified. It takes no arguments, so the argument count should be set to zero. 

Here's an example, with a flag called 'private'.

```bash
send private to alice bob carol. text Hello, world.

# This is also valid, of course.
send to alice bob carol. private. text Hello, world.
```

Humanist parses flags as booleans.

```javascript
const options = [
  ["to", Infinity],
  ["text", Infinity],
  ["private", 0] // means it's a flag
];

/* Prints:
{
  to: ["alice", "bob", "carol"],
  text: ["Hello,", "world."],
  private: true
}
*/
console.log(parser("private to alice bob carol. text Hello, world."));

/*
  Passing an array of words yields the same result.
  With nodejs, you can pass the command line param array.
*/
console.log(
  parser(["private", "to", "alice", "bob", "carol.", "text", "Hello", "world."])
);
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

### Escaping periods in arguments

If there are one or more literal periods at the end of an argument (say, "Hello... World"), the literal periods will need to be 'escaped'. Escaping is done by replacing every literal period with two periods.

```bash
# To say "Hello... World", use 6 periods instead of 3.
imessage to alice bob carol. text Hello...... World
```

If the period is not immediately followed by a space or if the period is at the end of the sentence, they do not require escaping.

```bash
# The period in jeswin.org does not require escaping since the '.' is not followed by a space
imessage to mailbox@jeswin.org text Hi

# The period in 'Hello, world.' does not require escaping since the '.' is at the end of the sentence.
imessage to jeswin text Hello, world.
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
