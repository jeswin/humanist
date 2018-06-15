import exception from "./exception";

export interface IResult {
  _: string[];
  [key: string]: boolean | string | string[];
}

export interface IOptionSettings {
  join?: boolean;
  multiple?: boolean;
}

export type OptionEntry = [string, number] | [string, number, IOptionSettings];

export function assignNonFlag(
  acc: IResult,
  prop: string,
  value: boolean | string | string[],
  option: OptionEntry
) {
  const multiple =
    option[2] && (option[2] as IOptionSettings).multiple === true;

  if (typeof acc[prop] !== "undefined") {
    if (Array.isArray(acc[prop])) {
      (acc[prop] as any).push(value);
    } else {
      if (multiple) {
        acc[prop] = [acc[prop]].concat(value) as any;
      }
    }
  } else {
    acc[prop] = value;
  }
}

// function argIsTerminated(arg: string): [boolean, string] {
//   const periods = /((\.)+)$/.exec(arg);
//   return periods && periods[1].length > 0
//     ? ((): [boolean, string] => {
//         const numPeriods = periods[1].length;
//         const periodsAfterEscape = Math.floor(numPeriods / 2);
//         const isOdd = numPeriods % 2 !== 0;
//         const escaped =
//           arg.substr(0, arg.length - numPeriods) +
//           ".".repeat(periodsAfterEscape);
//         return [isOdd, escaped];
//       })()
//     : [false, arg];
// }

type LiteralResult = [number, string];

function getLiteral(args: string[], cursor: number): LiteralResult {
  const acc: string[] = [];
  let i: number;
  for (i = cursor; i < args.length; i++) {
    const arg = args[i];
    const lcaseArg = arg.toLowerCase();
    if (lcaseArg === "k.") {
      break;
    } else {
      if (lcaseArg.endsWith("kk.")) {
        acc.push(arg.substring(arg.length - 2) + ".");
      } else {
        acc.push(arg);
      }
    }
  }
  return [cursor + i, acc.join(" ")];
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
      isLiteral: boolean,
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
      isLiteral: boolean,
      cursor: number,
      matchingOpt: OptionEntry,
      loop: Loop
    ): IResult {
      const arg = args[cursor + 1];
      return cursor + 1 < args.length
        ? isLiteral
          ? (() => {
              const [literalEnd, value] = getLiteral(args, cursor + 1);
              return (
                assignNonFlag(acc, name, value, matchingOpt),
                loop(acc, literalEnd + 1)
              );
            })()
          : (assignNonFlag(
              acc,
              name,
              /\.$/.test(arg) ? arg.substring(0, arg.length - 1) : arg,
              matchingOpt
            ),
            loop(acc, cursor + 2))
        : exception(
            `Cannot read command line option ${name} which takes 1 argument.`
          );
    }

    function matchOptionWithMoreThanOneArg(
      acc: IResult,
      name: string,
      numArgs: number,
      isLiteral: boolean,
      cursor: number,
      matchingOpt: OptionEntry,
      loop: Loop
    ): IResult {
      return cursor + numArgs < args.length
        ? (() => {
            const argsForOpt = args.slice(cursor + 1, cursor + 1 + numArgs);
            const first = argsForOpt.slice(0, -1);
            const last = argsForOpt.slice(-1)[0];
            const periodInNonTrailingArg = first.some(x => /\.$/.test(x));

            return !periodInNonTrailingArg
              ? (assignNonFlag(
                  acc,
                  name,
                  first.concat(
                    /\.$/.test(last) ? last.substring(0, last.length - 1) : last
                  ),
                  matchingOpt
                ),
                loop(acc, cursor + numArgs + 1))
              : exception(
                  `Option ${name} needs ${numArgs} arguments, but was terminated prematurely with a period.`
                );
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
      isLiteral: boolean,
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
          : /\.$/.test(arg)
            ? argAcc.concat(arg.substring(0, arg.length - 1))
            : loopToTerminator(argAcc.concat(arg), i + 1);
      })([], 0);
      /* See if need to send back a string */
      assignNonFlag(
        acc,
        name,
        matchingOpt[2] && (matchingOpt[2] as IOptionSettings).join
          ? optArgs.join(" ")
          : optArgs,
        matchingOpt
      );
      return loop(acc, cursor + optArgs.length + 1);
    }

    const result: IResult = (function loop(
      acc: IResult,
      cursor: number
    ): IResult {
      return args.length > cursor
        ? (() => {
            const arg = args[cursor];
            const isLiteral = /\.$/.test(arg);
            const item = isLiteral ? arg.substring(0, arg.length - 1) : arg;
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
                  return matchFn(
                    acc,
                    name,
                    numArgs,
                    isLiteral,
                    cursor,
                    matchingOpt,
                    loop
                  );
                })()
              : (acc._.push(item), loop(acc, cursor + 1));
          })()
        : acc;
    })({ _: [] }, 0);

    return result;
  };
}
