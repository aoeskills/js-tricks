// options 是給下拉式選單用的參數
// ExcludeOptionType 指的是 options 中有些不能點擊的項目，例如 DividerOption
// onItemClick 是一個 callBack ，除了 ExcludeOptionType 以外所有 option 被點擊後會將 value 作為參數呼叫 onItemClick
// 目標是要藉由 options 找出 onItemClick

// tool types
type IAnyObject = Record<string | number | symbol, any>;
type KeyofOptions<A extends Readonly<IAnyObject[]>> = A extends (infer T)[]
  ? keyof T
  : never;
type Merge<T extends IAnyObject> = { [K in keyof T]: T[K] };

/**
 * options 可能是 ExcludeOptionType 與其他 options 的 聯集 array
 * 例如底下這個 options 與他的 type
 * =========================================
 * const options = [
 *   {isDivider: true}                // ← ExcludeOptionType
 *   , {value: 'a', label: 'a', ...}  // ← options
 * ]
 *
 * typeof options
 * ({
 *    isDivider: boolean;
 *    value?: undefined;
 *    label?: undefined;
 *  } | {
 *    value: string;
 *    label: string;
 *    isDivider?: undefined;
 *  })[]
 * =========================================
 *
 * 此時在這個 options 的聯集 array 中， ExcludeOptions 的型別就是
 * {
 *   isDivider: boolean;
 *   value?: undefined;
 *   label?: undefined;
 * }
 * 也就是 options 內全部 option 的 keys 組成的 undefined map 再加上 { isDivider: boolean}
 */
type ExcludeOptionTypeInUnion<
  Keys extends string | number | symbol,
  ExcludeOptionType,
> = Merge<
  {
    [K in Exclude<Keys, keyof ExcludeOptionType>]?: never;
  } & ExcludeOptionType
>;

/**
 * 現在已經知道了 ExcludeOptionTypeInUnion 的型別，剩下的 option 就是泛型要處理的對象
 * typeof options 就可以被解析成 (
 *   {value: string; label: string; isDivider?: undefined;}
 *   | ExcludeOptionTypeInUnion<...>
 * )[]
 * 現在只要將 {value: string; label: string; isDivider?: undefined;} 的部分處理成泛型，就可以拿到 value 的型別
 * 最終，typeof options 會變成 (HaveValueOption<Value> | ExcludeOptionTypeInUnion<...>)[]
 * 而成功 extends 的時候 HaveValueOption<Value> 的 Value 就是最終回傳的型別
 */
type HaveValueOption<Value extends any> = {
  value: Value;
};
type HaveValueOptionInUnion<
  Options extends Readonly<IAnyObject[]>,
  ExcludeOptionType extends Readonly<IAnyObject>,
  Value extends any,
> = (
  | HaveValueOption<Value>
  | ExcludeOptionTypeInUnion<KeyofOptions<Options>, ExcludeOptionType>
)[];

// 如果不是 (HaveValueOption|ExcludeOptionTypeInUnion)[] 的話，剩下的可能性都可以被 optional value 的型別滿足
type MaybeHaveValueOptionInUnion<T extends any> = Record<any, any> & {
  value?: T;
};
export type ValueOfOptions<
  Options extends Readonly<IAnyObject[]>,
  ExcludeOptionType extends IAnyObject,
> = Options extends Readonly<
  HaveValueOptionInUnion<Options, ExcludeOptionType, infer Value>
>
  ? Value
  : Options extends Readonly<MaybeHaveValueOptionInUnion<infer Value>[]>
  ? Value | undefined
  : never;

type TestOptionType = {
  value?: string | number;
  label?: string;
  isDivider?: boolean;
};
type IsDividerOption = {
  isDivider: boolean;
};
function testFunc<T extends Readonly<TestOptionType[]>>(
  options: T,
  onClick: (value: ValueOfOptions<T, IsDividerOption>) => void,
) {
  const filteredOptions = options.filter((opt) => 'isDivider' in opt);
  const randomIndex = Math.floor(Math.random() * filteredOptions.length);
  onClick(filteredOptions[randomIndex] as ValueOfOptions<T, IsDividerOption>);
}

const constOptions = [
  { value: 'a' },
  { value: 'b' },
  { isDivider: false },
] as const;
const constOptionalValueOptions = [
  { value: 'a' },
  { value: 'b' },
  { isDivider: false },
  { label: 'a' },
] as const;
const stringOptions = [{ value: 'a' }, { isDivider: false }];
const numberOptions = [{ value: 1 }, { isDivider: false }];
const stringOptionalValueOptions = [
  { value: 'a' },
  { isDivider: false },
  { label: 'def' },
];
const manyFieldOptions = [
  {
    value: 'a',
    label: 'a',
    className: 'abc',
  },
  {
    value: 'b',
    className: 'abc',
  },
  { isDivider: true },
];
testFunc(constOptions, function onClick(v) {
  console.log(v);
  // "a" | "b"
});
testFunc(constOptionalValueOptions, function onClick(v) {
  console.log(v);
  // "a" | "b" | undefined
});
testFunc(stringOptions, function onClick(v) {
  console.log(v);
  // string
});
testFunc(numberOptions, function onClick(v) {
  console.log(v);
  // number
});
testFunc(stringOptionalValueOptions, function onClick(v) {
  console.log(v);
  // string | undefined
});
testFunc(manyFieldOptions, function onClick(v) {
  console.log(v);
  // string
});
