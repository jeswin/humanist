# humanist
A specification and parser for easy-to-understand command line options.

Goals:

- Easy to type on computers and mobiles
- Should be similar to natural language

## Examples of messages we'll try to parse

```bash
# Add a todo via an imaginary todo bot
todo due tomorrow Get two bottles of milk

# Alternate form
todo task Get two bottles of milk. due tomorrow



# Message to a bot which publishes blog posts.
publish <post_id> title Announcing Humanist
```

## Defining Options

We must define possible options we want to parse during initialization. 

Humanist supports the following options.

- Boolean value
- String value
- Single-word option
- Multi-word option
- Unnamed words

### Boolean flag:

```javascript
// A boolean flag
const parse = humanist({
  completed: "boolean"
});
const str = "blog delete";
// { completed: true }
console.log(parse(str)); 
```

The option can also be a regex. With slightly verbose syntax.


schema = [
  "publisj",
  postId,
  any([
    captureIf(x => x === "publish"),
    captureIf(x => x === "")
]



```javascript
// A boolean flag
const parse = humanist({
  completed: { type: "boolean", regex: /completed?/ }
});
const str1 = "todo complete";
const str2 = "todo completed";
// { completed: true }
console.log(parse(str1)); 
// { completed: true }
console.log(parse(str2)); 
```

### String value

Assume we want to capture the id of a certain todo.
Let's assume anything that starts with an "@" is an id.

```javascript
// A boolean flag
const parse = humanist({
  completed: { type: "boolean", regex: /completed?/ },
  todoId: { type: "string", regex: /^\@/ }
});
const str1 = "todo @200 complete";
// { todoId: "@200", completed: true }
console.log(parse(str1)); 
```

### Single-word options

```javascript
// A boolean flag
const parse = humanist({
  add: 
  completed: { type: "boolean", regex: /completed?/ },
  todoId: { type: "string", regex: /^\@/ }
});
const str1 = "todo add complete";
// { todoId: "@200", completed: true }
console.log(parse(str1)); 
```


### Single-word options

```javascript
// A boolean flag
const parse = humanist({
  add: 
  completed: { type: "boolean", regex: /completed?/ },
  todoId: { type: "string", regex: /^\@/ }
});
const str1 = "todo add complete";
// { todoId: "@200", completed: true }
console.log(parse(str1)); 
```

