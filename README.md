# humanist

A specification and parser for command line options, with a focus on ease of typing. When using humanist to parse command line options, it is recommended to stay close to natural language. That would make humanist-based options a good fit for communicating with bots.

## What does it look like?

Assuming your app is called 'reminder':

```bash
reminder due tomorrow todo Get two bottles of milk
```

Or if you have a messaging app called 'send':

```bash
send to alice bob carol. text Hello, world.
```

## Basic grammar and options

Let's consider the first example 'reminder due tomorrow todo Get two bottles of milk'. While defining the reminder app's options, we must specify that the option "due" takes a single parameter, and todo takes multiple parameters.

```javascript
const options = {
  due: 1, // takes a single argument
  todo: { multi: true } // takes multiple arguments
};
```

You could also write this as:

```javascript
const options = {
  due: { multi: false, args: 1 },
  todo: { multi: true }
};
```

What if there are several mutli-parameter options? That's where the period comes handy - 'send to alice bob carol. text Hello, world.'

You'd use the same structure to specify options:

```javascript
const options = {
  to: { multi: true },
  text: { multi: true }
};
```

What about options which don't need an argument? They're called flags; just specify zero as the argument count. Here's an example, with a flag called 'private'

```javascript
const options = {
  to: { multi: true },
  text: { multi: true },
  private: 0 // means it's a flag
};
```

```bash
send private to alice bob carol. text Hello, world
```

This is also valid, of course.

```bash
send to alice bob carol. private. text Hello, world
```

Finally, what if there is a period in the argument itself. For instance, what if the text you want to send is "Hello, world."? You'll have to 'escape' it by adding an additional period.

```bash
# Notice the additional period.
send to alice bob carol. text Hello, world..
```

One more thing. If the period is not immediately followed by a space, it does not require any special handling. In the following example 'jeswin.pk' does not require 'escaping'.

```bash
send to jeswin.pk@jeswin.org text Hello, world.
```

## Using humanist in nodejs and browser projects

```javascript
const options = {
  to: { multi: true },
  text: { multi: true },
  private: 0
};
const parser = humanist(options);

/* Prints:
  {
    to: ["alice", "bob", "carol"],
    private: true,
    text: ["Hello,", "world"]
  }
*/
console.log(parser("send to alice bob carol. private. text Hello, world"));
```



