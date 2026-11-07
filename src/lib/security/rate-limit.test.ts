import { describe, expect, it } from "vitest";

import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("lets attempts through up to the limit, then turns them away", () => {
    let now = 0;
    const limiter = createRateLimiter({
      limit: 2,
      windowMs: 1000,
      now: () => now,
    });
    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(true);
    const third = limiter.check("a");
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBe(1);
    now = 1000;
    expect(limiter.check("a").allowed).toBe(true);
  });

  it("tells how long to wait until the oldest attempt leaves the window", () => {
    let now = 0;
    const limiter = createRateLimiter({
      limit: 1,
      windowMs: 10_000,
      now: () => now,
    });
    limiter.check("a");
    now = 4000;
    expect(limiter.check("a").retryAfterSeconds).toBe(6);
  });

  it("does not count a refused attempt, so waiting is enough", () => {
    let now = 0;
    const limiter = createRateLimiter({
      limit: 1,
      windowMs: 1000,
      now: () => now,
    });
    limiter.check("a");
    now = 500;
    limiter.check("a");
    now = 1000;
    expect(limiter.check("a").allowed).toBe(true);
  });

  it("counts each visitor separately", () => {
    const limiter = createRateLimiter({
      limit: 1,
      windowMs: 1000,
      now: () => 0,
    });
    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("b").allowed).toBe(true);
  });

  it("forgets the oldest visitors when memory is full", () => {
    const limiter = createRateLimiter({
      limit: 1,
      windowMs: 1000,
      maxKeys: 2,
      now: () => 0,
    });
    limiter.check("a");
    limiter.check("b");
    limiter.check("c");
    expect(limiter.size()).toBe(2);
  });

  it("rounds the waiting time up to whole seconds", () => {
    let now = 0;
    const limiter = createRateLimiter({
      limit: 1,
      windowMs: 10_000,
      now: () => now,
    });
    limiter.check("a");
    now = 4500;
    expect(limiter.check("a").retryAfterSeconds).toBe(6);
  });

  it("forgets the visitor who was seen longest ago, not the one who came first", () => {
    let now = 0;
    const limiter = createRateLimiter({
      limit: 2,
      windowMs: 1000,
      maxKeys: 2,
      now: () => now,
    });
    limiter.check("a");
    now = 100;
    limiter.check("b");
    now = 200;
    limiter.check("a");
    now = 300;
    limiter.check("c");
    expect(limiter.check("a").allowed).toBe(false);
  });

  it("does not forget anybody when a known visitor tries again while memory is full", () => {
    const limiter = createRateLimiter({
      limit: 2,
      windowMs: 1000,
      maxKeys: 2,
      now: () => 0,
    });
    limiter.check("a");
    limiter.check("a");
    limiter.check("b");
    limiter.check("b");
    expect(limiter.size()).toBe(2);
    expect(limiter.check("a").allowed).toBe(false);
  });

  it("does not hang when it may remember nobody", () => {
    const limiter = createRateLimiter({
      limit: 1,
      windowMs: 1000,
      maxKeys: 0,
      now: () => 0,
    });
    expect(limiter.check("a").allowed).toBe(true);
  });
});
