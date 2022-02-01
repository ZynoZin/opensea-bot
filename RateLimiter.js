const { RateLimiter } = require('limiter');

function nextTick () {
  return sleep(0);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = class LibRateLimiter {
  constructor ({ maxRequests, maxRequestWindowMS }) {
    this.maxRequests = maxRequests;
    this.maxRequestWindowMS = maxRequestWindowMS;
    this.limiter = new RateLimiter({ 
      tokensPerInterval: this.maxRequests,
      interval: this.maxRequestWindowMS, 
      fireImmediately: false 
    });
  }

  async acquireToken (fn) {
    if (this.limiter.tryRemoveTokens(1)) {
      await nextTick();
      return fn();
    } else {
      await sleep(this.maxRequestWindowMS);
      return this.acquireToken(fn);
    }
  }
}
