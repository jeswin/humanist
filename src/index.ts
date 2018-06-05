import exception from "./exception";

export interface IResult {
  _: string[];
  [key: string]: boolean | string | string[];
}

export interface IOptionSettings {
  join?: boolean;
}

export type OptionEntry = [string, number, IOptionSettings];

function concat<T>(x: T[], y: T[]) {
  return x.concat(y);
}

function flatMap<T>(f: (x: T) => T[], xs: T[]): T[] {
  return xs.map(f).reduce(concat, []);
}

function unescapePeriod(arg: string): string {
  return "";
}

// function normalizeArgs(args: string[]): string[] {
//   const last = args.slice(-1)[0];
//   const rest = args.slice(0, -1);
//   const r = rest.reduce((acc, arg) => {
//     const []
//   }, [[]] as string[][]);
//   const results = flatMap(
//     x =>
//       x.endsWith(".")
//         ? !x.endsWith("..")
//           ? x.substring(0, x.length - 1)
//           :
//         :
//       x.endsWith("..")
//         ? (() => {
//             const periods = /((\.\.)+)$/.exec(x);
//             return periods.length > 1
//             ?
//              : 2;
//             return [x];
//           })()
//         : [x],
//     rest
//   );
//   return results.concat(last);
// }

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
            const matchingOpt = options.find(o => o[0] === item);
            return matchingOpt
              ? (() => {
                  const [name, numArgs, settings] = matchingOpt;
                  return numArgs === 0
                    ? ((acc[name] = true), loop(acc, cursor + 1))
                    : numArgs === 1
                      ? cursor + 1 < args.length
                        ? ((acc[name] = args[cursor + 1]),
                          loop(acc, cursor + 2))
                        : exception(
                            `Cannot read command line option ${name} which takes 1 argument.`
                          )
                      : numArgs < Infinity
                        ? cursor + numArgs < args.length
                          ? ((acc[name] = args.slice(cursor + 1, numArgs)),
                            loop(acc, cursor + numArgs + 1))
                          : exception(
                              `Cannot read command line option ${name} which takes ${numArgs} arguments.`
                            )
                        : numArgs === Infinity
                          ? cursor + 1 < args.length
                            ? ((acc[name] = args[cursor + 1]),
                              loop(acc, cursor + 2))
                            : exception(
                                `Cannot read command line option ${name}.`
                              )
                          : exception(
                              `The option ${name} cannot have ${numArgs} args. Invalid configuration.`
                            );
                })()
              : (acc._.push(item), loop(acc, cursor + 1));
          })()
        : acc;
    })({ _: [] }, 0);
  };
}
