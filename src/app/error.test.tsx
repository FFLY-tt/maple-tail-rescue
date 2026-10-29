import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import ErrorPage from "@/app/error";
import GlobalError from "@/app/global-error";

const error = Object.assign(new Error("boom"), { digest: "abc" });

describe("error.tsx", () => {
  const html = renderToStaticMarkup(<ErrorPage error={error} reset={vi.fn()} />);

  it("shows a friendly message, a retry button and a way back home", () => {
    expect(html).toContain("Something went wrong");
    expect(html).toContain("Try again");
    expect(html).toMatch(/<a [^>]*href="\/"[^>]*>Back to home<\/a>/);
  });

  it("doesn't show the technical error to visitors", () => {
    expect(html).not.toContain("boom");
    expect(html).not.toContain("abc");
  });
});

describe("global-error.tsx", () => {
  const html = renderToStaticMarkup(<GlobalError error={error} reset={vi.fn()} />);

  it("renders a full page of its own, because it replaces the layout", () => {
    expect(html).toMatch(/^<html lang="en">/);
    expect(html).toContain("<body");
  });

  it("offers a retry button and a plain link home (the router may be what failed)", () => {
    expect(html).toContain("Try again");
    expect(html).toMatch(/<a [^>]*href="\/"[^>]*>Back to home<\/a>/);
  });

  it("doesn't show the technical error to visitors", () => {
    expect(html).not.toContain("boom");
  });
});
