import "mocha";
import "should";
import humanist from "../";

const shouldLib = require("should");

describe("humanist", () => {
  it("parses flags", () => {
    const parser = humanist([["save", 0]]);
    const result = parser("save");
    result.save.should.be.true();
  });

  it("parses options with one argument", () => {
    const parser = humanist([["comments", 1]]);
    const result = parser("comments off");
    result.comments.should.equal("off");
  });

  it("parses options with more than 1 argument", () => {
    const parser = humanist([["send", 3]]);
    const result = parser("send alice bob carol");
    result.send.should.deepEqual(["alice", "bob", "carol"]);
  });

  it("parses options with arbitrary number of arguments", () => {
    const parser = humanist([["send", Infinity]]);
    const result = parser("send alice bob carol");
    result.send.should.deepEqual(["alice", "bob", "carol"]);
  });

  it("parses options with arbitrary number of arguments as a string", () => {
    const parser = humanist([["title", Infinity, { join: true }]]);
    const result = parser("title hello, world");
    result.title.should.deepEqual("hello, world");
  });

  it("parses a flag and a single arg option", () => {
    const parser = humanist([["save", 0], ["comments", 1]]);
    const result = parser("comments off save");
    result.save.should.be.true();
    result.comments.should.equal("off");
  });

  it("parses a single arg option and a multi arg option", () => {
    const parser = humanist([["comments", 1], ["send", 3]]);
    const result = parser("comments off send alice bob carol");
    result.comments.should.equal("off");
    result.send.should.deepEqual(["alice", "bob", "carol"]);
  });

  it("parses two options of arbitrary length", () => {
    const parser = humanist([["title", Infinity], ["send", Infinity]]);
    const result = parser("title Hello world. send alice bob carol");
    result.title.should.deepEqual(["Hello", "world"]);
    result.send.should.deepEqual(["alice", "bob", "carol"]);
  });

  it("is not case-sensitive", () => {
    const parser = humanist([["save", 0]]);
    const result = parser("Save");
    result.save.should.be.true();
  });

  it("parses two options of arbitrary length", () => {
    const parser = humanist([["title", Infinity], ["send", Infinity]]);
    const result = parser("title Hello world. send alice bob carol");
    result.title.should.deepEqual(["Hello", "world"]);
    result.send.should.deepEqual(["alice", "bob", "carol"]);
  });
});
