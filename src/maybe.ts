//http://jrsinclair.com/articles/2016/marvellously-mysterious-javascript-maybe-monad/

export default class Maybe<T> {
  private __value: T;

  private constructor(val: T) {
    this.__value = val
  }

  static of<U>(val: U) {
    return new Maybe(val)
  }

  isNothing() {
    return (this.__value === null || this.__value === undefined)
  }

  map<U>(f: (value: T) => U): Maybe<U> {
    if (this.isNothing()) {
      return Maybe.of(null)
    }
    return Maybe.of(f(this.__value))
  }

  foreach(f: (value: T) => void): void {
    if (!this.isNothing()) {
      f(this.__value)
    }
  }

  orElse(d: T): Maybe<T> {
    if (this.isNothing()) {
      return Maybe.of(d)
    }

    return this
  }

  getOrElse(d: T): T {
    if (this.isNothing()) {
      return d
    }

    return this.__value
  }
}
