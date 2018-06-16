import exception from "./exception";

export interface IResult {
  _: string[];
  [key: string]: boolean | string | string[];
}

export interface IOptionSettings {
  join?: boolean;
}

export type OptionTypes = "flag" | "single" | "multi";
export type OptionEntry =
  | [string, OptionTypes]
  | [string, OptionTypes, IOptionSettings];

export type CustomParserResult = [number, IResult];
export type CustomParser = (
  arg: string,
  index: number,
  args: string[],
  current: IResult
) => CustomParserResult | undefined;

export function assignNonFlag(
  acc: IResult,
  prop: string,
  value: boolean | string | string[],
  option: OptionEntry
) {
  if (typeof acc[prop] !== "undefined") {
    if (Array.isArray(acc[prop])) {
      acc[prop] = (acc[prop] as any[]).concat(value);
    } else {
      acc[prop] = [acc[prop]].concat(value) as any[];
    }
  } else {
    acc[prop] = value;
  }
}

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
      if (/^k{2,}\.$/i.test(arg)) {
        acc.push(arg.substring(0, arg.length - 2) + ".");
      } else {
        acc.push(arg);
      }
    }
  }
  return [i, acc.join(" ")];
}

type Loop = (acc: IResult, cursor: number) => IResult;

export default function humanist(
  options: OptionEntry[],
  customParser?: CustomParser
) {
  return (argsStringOrArray: string | string[]) => {
    const args =
      typeof argsStringOrArray === "string"
        ? argsStringOrArray
            .split(" ")
            .filter(x => x !== "" && x !== " " && typeof x !== "undefined")
        : Array.isArray(argsStringOrArray)
          ? argsStringOrArray
          : exception(
              "The argument to humanist must be a string or a string array."
            );

    function matchFlag(
      acc: IResult,
      name: string,
      isLiteral: boolean,
      cursor: number,
      matchingOpt: OptionEntry,
      loop: Loop
    ): IResult {
      acc[name] = true;
      return loop(acc, cursor + 1);
    }

    function matchUnaryOption(
      acc: IResult,
      name: string,
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

    function matchVariadicOption(
      acc: IResult,
      name: string,
      isLiteral: boolean,
      cursor: number,
      matchingOpt: OptionEntry,
      loop: Loop
    ): IResult {
      return isLiteral
        ? (() => {
            const [literalEnd, value] = getLiteral(args, cursor + 1);
            return (
              assignNonFlag(acc, name, value, matchingOpt),
              loop(acc, literalEnd + 1)
            );
          })()
        : (() => {
            const optArgs = (function loopToTerminator(
              argAcc: string[],
              i: number
            ): string[] {
              const arg = args[cursor + 1 + i];
              return cursor + 1 + i < args.length - 1
                ? /\.$/.test(arg)
                  ? argAcc.concat(arg.substring(0, arg.length - 1))
                  : loopToTerminator(argAcc.concat(arg), i + 1)
                : argAcc.concat(
                    !/\.$/.test(arg) ||
                    (matchingOpt[2] && (matchingOpt[2] as IOptionSettings).join)
                      ? arg
                      : arg.substring(0, arg.length - 1)
                  );
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
          })();
    }

    const result: IResult = (function loop(
      acc: IResult,
      cursor: number
    ): IResult {
      return args.length > cursor
        ? (() => {
            const arg = args[cursor];
            const customParseResult = customParser
              ? customParser(arg, cursor, args, acc)
              : undefined;

            return customParseResult
              ? loop(customParseResult[1], customParseResult[0])
              : (() => {
                  const isLiteral = /\.$/.test(arg);
                  const item = isLiteral
                    ? arg.substring(0, arg.length - 1)
                    : arg;
                  const matchingOpt = options.find(
                    o => o[0].toLowerCase() === item.toLowerCase()
                  );
                  return matchingOpt
                    ? (() => {
                        const [name, optionType] = matchingOpt;
                        const matchFn =
                          optionType === "flag"
                            ? matchFlag
                            : optionType === "single"
                              ? matchUnaryOption
                              : optionType === "multi"
                                ? matchVariadicOption
                                : /* Arg count should be a number gte zero */
                                  invalidOptionTypeError(name, optionType);
                        return matchFn(
                          acc,
                          name,
                          isLiteral,
                          cursor,
                          matchingOpt,
                          loop
                        );
                      })()
                    : (acc._.push(item), loop(acc, cursor + 1));
                })();
          })()
        : acc;
    })({ _: [] }, 0);

    return result;
  };
}

function invalidOptionTypeError(name: string, optionType: string) {
  return exception(
    `The option ${name}'s type should be one of 'flag', 'single' or 'multi', but got '${optionType}'.`
  );
}
