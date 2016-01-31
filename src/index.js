const HALFHOUR = 1800000;
const SECOND   = 1000;
const INIT_STATE = 1;
const DEFAULT_INC = 0.1;

const KEYS = new WeakMap();


class TriggerStatus {
  constructor (didRun, promise) {
    this._didRun = didRun;
    this._promise = promise;
  }

  get didRun () { return this._didRun; }

  get promise () { return this._promise; }
}


export class ExpotenialBackoff {
  constructor (options = {}) {
    const {
      callback,
      capacity = HALFHOUR,
      initial = SECOND,
      increment = DEFAULT_INC,
    } = options

    this._capacity  = capacity;
    this._initial   = initial;
    this._increment = increment;
    this._state = INIT_STATE;
    this._callback = callback;
    this._lastOperation = -Infinity;
  }

  /**
   * time since last invokation
   */
  get idelTime () {
    return Date.now() - this._lastOperation;
  }

  /**
   * if an opeation is currently running
   */
  get isRunning () {
    return KEYS.has(this);
  }

  /**
   * waitTime for next operation
   */
  get nextWaitPeriod () {
    return Math.pow(this._initial, this._state);
  }

  /**
   * force an operation if one is not already running
   */
  trigger (key) {
    if (this._isInvokeable(key)) {
      const value = this._invoke();
      return new TriggerStatus(true, value);
    }
    else {
      return new TriggerStatus(false, null);
    }
  }

  /**
   * will queue next opperation, only if an operation, is not
   * running, or if the key from the latest queue is passed.
   */
  queue (key) {
    if (this._isInvokeable(key)) {
      setTimeout(() => {
        this._invoke();
      }, this.nextWaitPeriod);
      this._state += this._increment;
    }
  }

  reset () {
    this._state = INIT_STATE;
  }

  /**
   * if no key is being store or if a key
   * is specified and it matches the stored key
   */
  _isInvokeable (key) {
    return (! KEYS.has(this)) || (key != null && key === KEYS.get(this));
  }

  _invoke () {
    KEYS.set(this, Symbol());
    const result = this._callback.call(null, this, KEYS.get(this));
    const cleanup = () => {
      KEYS.set(this, null);
      this._lastOperation = Date.now();
    };

    if (result != null && result.then != null) {
      result.then(cleanup, cleanup);
      return result;
    }
    else {
      cleanup();
      return Promise.resolve(result);
    }
  }
};


export default ExpotenialBackoff;
