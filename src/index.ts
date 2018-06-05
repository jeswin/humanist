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
  return periods 
    ? (() => {
      const isOdd = periods[1].length % 2 !== 0
      return isOdd
        ? [isOdd, arg.replace()]
    })()
  [, arg] : [false, arg];
}

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
                  /* Flags - Options without arguments */
                  return numArgs >= 0
                    ? numArgs === 0
                      ? ((acc[name] = true), loop(acc, cursor + 1))
                      : /* Options with one argument */
                        numArgs === 1
                        ? cursor + 1 < args.length
                          ? ((acc[name] = args[cursor + 1]),
                            loop(acc, cursor + 2))
                          : exception(
                              `Cannot read command line option ${name} which takes 1 argument.`
                            )
                        : /* Options with mutliple arguments */
                          numArgs < Infinity
                          ? cursor + numArgs < args.length
                            ? ((acc[name] = args.slice(
                                cursor + 1,
                                cursor + numArgs + 1
                              )),
                              loop(acc, cursor + numArgs + 1))
                            : exception(
                                `Option ${name} needs ${numArgs} arguments, found ${args.length -
                                  (cursor + 1)}.`
                              )
                          : /* Options with arbitrary arguments */
                            (() => {
                              const optArgs = (function loopToTerminator(
                                argAcc: string[],
                                i: number
                              ): any {
                                const arg = args[cursor + 1 + i];
                                return cursor + 1 + i === args.length - 1
                                  ? argAcc.concat(arg)
                                  : (() => {
                                      const [
                                        isTerminated,
                                        escapedArg
                                      ] = argIsTerminated(arg);
                                      return isTerminated
                                        ? argAcc.concat(escapedArg)
                                        : loopToTerminator(
                                            argAcc.concat(escapedArg),
                                            i + 1
                                          );
                                    })();
                              })([], 0);
                              /* See if need to send back a string */
                              return (
                                (acc[name] =
                                  matchingOpt[2] &&
                                  (matchingOpt[2] as IOptionSettings).join
                                    ? optArgs.join(" ")
                                    : optArgs),
                                loop(acc, cursor + optArgs.length + 1)
                              );
                            })()
                    : /* Arg count should be a number gte zero */
                      exception(
                        `The option ${name} cannot have ${numArgs} args. Invalid configuration.`
                      );
                })()
              : (acc._.push(item), loop(acc, cursor + 1));
          })()
        : acc;
    })({ _: [] }, 0);

    return result;
  };
}
