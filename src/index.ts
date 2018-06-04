export interface IVarArgs {
  multi: true;
}
export interface IFixedArgs {
  multi?: false;
  args: number;
}

export interface IHumanistOptions {
  [name: string]: number | IVarArgs | IFixedArgs;
}

type KOpt = keyof IHumanistOptions;

interface INormalizedOptions {
  [name: string]: IVarArgs | IFixedArgs;
}

function concat<T>(x: T[], y: T[]) {
  return x.concat(y);
}

function flatMap<T>(f: (x: T) => T[], xs: T[]): T[] {
  return xs.map(f).reduce(concat, []);
}

function isNumber(arg: number | IVarArgs | IFixedArgs): arg is number {
  return typeof arg === "number";
}

function normalizeOptions(options: IHumanistOptions): INormalizedOptions {
  const opts: INormalizedOptions = {};
  for (const key of Object.keys(options)) {
    const val = options[key];
    opts[key] = isNumber(val) ? 
        
    { multi: false, args: val } : val;
  }
  return opts;
}

export default function humanist(opts: IHumanistOptions) {
  const options = normalizeOptions(opts);
  return (args: string[]) => {
    const escaped = flatMap(arg => {
      return [arg];
    }, args);
  };
}
