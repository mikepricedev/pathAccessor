import PathNotation from 'path-notation';
import { KeyValueNode } from 'key-nodes';
interface ReturnIterableIterator<T, TReturn, TNext = undefined> extends Iterator<T, TReturn, TNext> {
    [Symbol.iterator](): ReturnIterableIterator<T, TReturn, TNext>;
}
declare const PATH: unique symbol;
export default class PathAccessor<TValue = any, TKey extends string | number = string | number, TDoc extends object | Array<any> = object | Array<any>> {
    private readonly [PATH];
    constructor(path: string | number | PathNotation);
    set(doc: TDoc, value?: TValue): ReturnIterableIterator<KeyValueNode<TKey, TValue, KeyValueNode<string | number, any, any>>, KeyValueNode<string | number, any, KeyValueNode<string | number, any, any>>[], undefined>;
    get(doc: TDoc): ReturnIterableIterator<KeyValueNode<TKey, TValue, KeyValueNode<string | number, any, any>>, KeyValueNode<string | number, any, KeyValueNode<string | number, any, any>>[], undefined>;
    getValue(doc: TDoc): IterableIterator<TValue>;
    readonly [Symbol.toStringTag]: string;
    static set<TValue = any, TKey extends string | number = string | number>(keyValueNode: KeyValueNode<TKey, TValue>, doc: object | Array<any>): ReturnIterableIterator<KeyValueNode<TKey, TValue>, KeyValueNode[]>;
    static set<TValue = any, TKey extends string | number = string | number>(path: string | number | PathNotation, doc: object | Array<any>, value: TValue): ReturnIterableIterator<KeyValueNode<TKey, TValue>, KeyValueNode[]>;
    static get<TValue = any, TKey extends string | number = string | number>(path: string | number | PathNotation, doc: object | Array<any>): ReturnIterableIterator<KeyValueNode<TKey, TValue>, KeyValueNode[]>;
    /**
     * Convenience method that yields the values instead of the KeyValueNodes.
     */
    static getValue<TValue = any>(path: string | number | PathNotation, doc: object | Array<any>): IterableIterator<TValue>;
}
export {};
