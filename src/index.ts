import exception from "./exception";

export interface IResult {
  _: string[];
  [key: string]: boolean | string | string[];
}

export interface IOptionSettings {
  join?: boolean;
}

export type OptionEntry = [string, number] | [string, number, IOptionSettings];

function concat<T>(x: T[], y: T[]) {
  return x.concat(y);
}

function flatMap<T>(f: (x: T) => T[], xs: T[]): T[] {
  return xs.map(f).reduce(concat, []);
}

function unescapePeriod(arg: string): string {
  return "";
}

function argIsTerminated(arg: string): [boolean, string] {
  const periods = /((\.)+)$/.exec(arg);
  return periods && periods[1].length > 0
    ? ((): [boolean, string] => {
        const numPeriods = periods[1].length;
        const periodsAfterEscape = Math.floor(numPeriods / 2);
        const isOdd = numPeriods % 2 !== 0;
        const escaped =
          arg.substr(0, arg.length - numPeriods) +
          ".".repeat(periodsAfterEscape);
        return [isOdd, escaped];
      })()
    : [false, arg];
}

type Loop = (acc: IResult, cursor: number) => IResult;

export default function humanist(options: OptionEntry[]) {
  return (argsStringOrArray: string | string[]) => {
    const args =
      typeof argsStringOrArray === "string"
        ? argsStringOrArray
            .split(" ")
            .filter(x => x !== " " && typeof x !== "undefined")
        : Array.isArray(argsStringOrArray)
          ? argsStringOrArray
          : exception(
              "The argument to humanist must be a string or a string array."
            );

    function matchFlag(
      acc: IResult,
      name: string,
      numArgs: number,
      cursor: number,
      matchingOpt: OptionEntry,
      loop: Loop
    ): IResult {
      acc[name] = true;
      return loop(acc, cursor + 1);
    }

    function matchOptionWithOneArg(
      acc: IResult,
      name: string,
      numArgs: number,
      cursor: number,
      matchingOpt: OptionEntry,
      loop: Loop
    ): IResult {
      return cursor + 1 < args.length
        ? ((acc[name] = argIsTerminated(args[cursor + 1])[1]),
          loop(acc, cursor + 2))
        : exception(
            `Cannot read command line option ${name} which takes 1 argument.`
          );
    }

    function matchOptionWithMoreThanOneArg(
      acc: IResult,
      name: string,
      numArgs: number,
      cursor: number,
      matchingOpt: OptionEntry,
      loop: Loop
    ): IResult {
      return cursor + numArgs < args.length
        ? (() => {
            const testedArgs = args
              .slice(cursor + 1, cursor + numArgs + 1)
              .map(x => argIsTerminated(x));
            const terminatedPrematurely = testedArgs
              .slice(0, -1)
              .some(x => x[0]);
            return terminatedPrematurely
              ? exception(
                  exception(
                    `Option ${name} needs ${numArgs} arguments, ` +
                      `but was terminated prematurely with a period.`
                  )
                )
              : ((acc[name] = testedArgs.map(x => x[1])),
                loop(acc, cursor + numArgs + 1));
          })()
        : exception(
            `Option ${name} needs ${numArgs} arguments, found ${args.length -
              (cursor + 1)}.`
          );
    }

    function matchOptionWithVarargs(
      acc: IResult,
      name: string,
      numArgs: number,
      cursor: number,
      matchingOpt: OptionEntry,
      loop: Loop
    ): IResult {
      const optArgs = (function loopToTerminator(
        argAcc: string[],
        i: number
      ): string[] {
        const arg = args[cursor + 1 + i];
        return cursor + 1 + i === args.length - 1
          ? argAcc.concat(arg)
          : (() => {
              const [isTerminated, escapedArg] = argIsTerminated(arg);
              return isTerminated
                ? argAcc.concat(escapedArg)
                : loopToTerminator(argAcc.concat(escapedArg), i + 1);
            })();
      })([], 0);
      /* See if need to send back a string */
      return (
        (acc[name] =
          matchingOpt[2] && (matchingOpt[2] as IOptionSettings).join
            ? optArgs.join(" ")
            : optArgs),
        loop(acc, cursor + optArgs.length + 1)
      );
    }

    const result: IResult = (function loop(
      acc: IResult,
      cursor: number
    ): IResult {
      return args.length > cursor
        ? (() => {
            const item = args[cursor];
            const matchingOpt = options.find(
              o => o[0].toLowerCase() === item.toLowerCase()
            );
            return matchingOpt
              ? (() => {
                  const [name, numArgs] = matchingOpt;
                  const matchFn =
                    numArgs >= 0
                      ? numArgs === 0
                        ? matchFlag
                        : numArgs === 1
                          ? matchOptionWithOneArg
                          : numArgs < Infinity
                            ? matchOptionWithMoreThanOneArg
                            : matchOptionWithVarargs
                      : /* Arg count should be a number gte zero */
                        exception(
                          `The option ${name} cannot have ${numArgs} args. Invalid configuration.`
                        );
                  return matchFn(acc, name, numArgs, cursor, matchingOpt, loop);
                })()
              : (acc._.push(item), loop(acc, cursor + 1));
          })()
        : acc;
    })({ _: [] }, 0);

    return result;
  };
}
