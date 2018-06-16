import "mocha";
import "should";
import humanist, { IResult, CustomParserResult } from "../";

const shouldLib = require("should");

describe("humanist", () => {
  it("parses flags", () => {
    const parser = humanist([["save", "flag"]]);
    const result = parser("save");
    result.save.should.be.true();
  });

  it("parses options with one argument", () => {
    const parser = humanist([["comments", "single"]]);
    const result = parser("comments off");
    result.comments.should.equal("off");
  });

  it("fails options with one argument when missing args", () => {
    let msg;
    try {
      const parser = humanist([["comments", "single"]]);
      const result = parser("comments");
    } catch (ex) {
      msg = ex.message;
    }
    msg.should.equal(
      "Cannot read command line option comments which takes 1 argument."
    );
  });

  it("parses options with one argument and terminating period", () => {
    const parser = humanist([["comments", "single"]]);
    const result = parser("comments off.");
    result.comments.should.equal("off");
  });

  it("parses options with literal values", () => {
    const parser = humanist([["comments", "single"]]);
    const result = parser("comments. off. for now. k.");
    result.comments.should.equal("off. for now.");
  });

  it("strips trailing period from unary option", () => {
    const parser = humanist([["send", "single"]]);
    const result = parser("send alice send bob. send carol.");
    result.send.should.deepEqual(["alice", "bob", "carol"]);
  });

  it("strips trailing period from variadic option", () => {
    const parser = humanist([["send", "multi"]]);
    const result = parser("send alice bob carol.");
    result.send.should.deepEqual(["alice", "bob", "carol"]);
  });

  it("parses options with arbitrary number of arguments", () => {
    const parser = humanist([["send", "multi"]]);
    const result = parser("send alice bob carol");
    result.send.should.deepEqual(["alice", "bob", "carol"]);
  });

  it("parses options with arbitrary number of arguments as a string", () => {
    const parser = humanist([["title", "multi", { join: true }]]);
    const result = parser("title hello, world");
    result.title.should.deepEqual("hello, world");
  });

  it("parses a flag and a single arg option", () => {
    const parser = humanist([["save", "flag"], ["comments", "single"]]);
    const result = parser("comments off save");
    result.save.should.be.true();
    result.comments.should.equal("off");
  });

  it("parses two options of arbitrary length", () => {
    const parser = humanist([["title", "multi"], ["send", "multi"]]);
    const result = parser("title Hello world. send alice bob carol");
    result.title.should.deepEqual(["Hello", "world"]);
    result.send.should.deepEqual(["alice", "bob", "carol"]);
  });

  it("is not case-sensitive", () => {
    const parser = humanist([["save", "flag"]]);
    const result = parser("Save");
    result.save.should.be.true();
  });

  it("parses two options of arbitrary length", () => {
    const parser = humanist([["title", "multi"], ["send", "multi"]]);
    const result = parser("title Hello world. send alice bob carol");
    result.title.should.deepEqual(["Hello", "world"]);
    result.send.should.deepEqual(["alice", "bob", "carol"]);
  });

  it("gives an array when unary options are repeated", () => {
    const parser = humanist([["send", "single"]]);
    const result = parser("send alice send bob send carol");
    result.send.should.deepEqual(["alice", "bob", "carol"]);
  });

  it("gives an array when variadic options are repeated (1)", () => {
    const parser = humanist([["title", "multi"]]);
    const result = parser("title Hello world. title alice bob carol");
    result.title.should.deepEqual(["Hello", "world", "alice", "bob", "carol"]);
  });

  it("gives an array when variadic options are repeated (2)", () => {
    const parser = humanist([["title", "multi", { join: true }]]);
    const result = parser("title War and Peace. title Don Quixote");
    result.title.should.deepEqual(["War and Peace", "Don Quixote"]);
  });

  it("gives an array when variadic opts are repeated with literal args", () => {
    const parser = humanist([["title", "multi", { join: true }]]);
    const result = parser("title. War and Peace. k. title. Don Quixote.");
    result.title.should.deepEqual(["War and Peace.", "Don Quixote."]);
  });

  it("does not capture repeating flags into an array", () => {
    const parser = humanist([["save", "flag"]]);
    const result = parser("save save save save");
    result.save.should.be.true();
  });

  it("parses multiple repeating unary options", () => {
    const parser = humanist([["send", "single"], ["file", "single"]]);
    const result = parser(
      "send alice send bob send carol file middle-class-rut.mp4 file dead-eye.mp3"
    );
    result.send.should.deepEqual(["alice", "bob", "carol"]);
    result.file.should.deepEqual(["middle-class-rut.mp4", "dead-eye.mp3"]);
  });

  it("parses a repeating unary option followed by a unary option", () => {
    const parser = humanist([["send", "single"], ["time", "single"]]);
    const result = parser("send alice send bob send carol time now");
    result.send.should.deepEqual(["alice", "bob", "carol"]);
    result.time.should.equal("now");
  });

  it("parses a soup of flag, unary and variadic opts with literals", () => {
    const parser = humanist([
      ["publish", "flag"],
      ["send", "single"],
      ["file", "multi"]
    ]);
    const result = parser(
      "publish send hello@scuttle.space file. Final Report.txt k. file a.txt b.txt. send carol file rep.txt. publish  "
    );
    result.publish.should.be.true();
    result.send.should.deepEqual(["hello@scuttle.space", "carol"]);
    result.file.should.deepEqual([
      "Final Report.txt",
      "a.txt",
      "b.txt",
      "rep.txt"
    ]);
  });

  it("escapes k.", () => {
    const parser = humanist([
      ["subject", "multi", { join: true }],
      ["msg", "multi", { join: true }]
    ]);
    const result = parser("subject. Hello world. kk. k. msg. Help me. k.");
    result.subject.should.equal("Hello world. k.");
    result.msg.should.equal("Help me.");
  });

  it("escapes Kk.", () => {
    const parser = humanist([
      ["subject", "multi", { join: true }],
      ["msg", "multi", { join: true }]
    ]);
    const result = parser("subject. Hello world. Kkk. k. msg. Help me. k.");
    result.subject.should.equal("Hello world. Kk.");
    result.msg.should.equal("Help me.");
  });

  it("parses two options with literal values", () => {
    const parser = humanist([
      ["subject", "multi", { join: true }],
      ["msg", "multi", { join: true }]
    ]);
    const result = parser("subject. Hello world. k. msg. Help me. k.");
    result.subject.should.equal("Hello world.");
    result.msg.should.equal("Help me.");
  });

  it("capture unmatched args in an underscore", () => {
    const parser = humanist([["title", "multi"], ["send", "multi"]]);
    const result = parser(
      "title Hello world. lorem send alice bob carol. ipsum dolor"
    );
    result.title.should.deepEqual(["Hello", "world"]);
    result._.should.deepEqual(["lorem", "ipsum", "dolor"]);
  });

  it("supports custom argument parsing", () => {
    function parse(
      arg: string,
      index: number,
      args: string[],
      current: IResult
    ): CustomParserResult | undefined {
      // If it starts with an '@' it's an account name
      if (/^@/.test(arg)) {
        const nextIndex = index + 1;
        const newResult: IResult = { ...current, account: arg.substring(1) };
        return [nextIndex, newResult];
      }
    }

    const parser = humanist([["email", "single"], ["file", "multi"]], parse);
    const result = parser(
      "@helloscuttlespace email hello@scuttle.space file a.txt b.txt"
    );
    result.account.should.equal("helloscuttlespace");
    result.email.should.equal("hello@scuttle.space");
    result.file.should.deepEqual(["a.txt", "b.txt"]);
  });
});
