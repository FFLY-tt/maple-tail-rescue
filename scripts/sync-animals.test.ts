import { afterEach, describe, expect, it, vi } from "vitest";

import { mapToAnimal, resolveAcfImageUrl, type RawAnimal } from "./sync-animals";

function raw(acf: RawAnimal["acf"], overrides: Partial<RawAnimal> = {}): RawAnimal {
  return {
    id: 42,
    slug: "mochi",
    title: { rendered: "Mochi" },
    featured_media: 7,
    acf,
    ...overrides,
  };
}

const goodAcf = {
  species: "cat",
  age_group: "baby",
  size: "small",
  sex: "female",
  good_with: ["cats", "kids"],
  personality: "  Curious and playful.  ",
  adoption_status: "available",
};

describe("mapToAnimal", () => {
  it("maps a complete WordPress record to an Animal", () => {
    expect(mapToAnimal(raw(goodAcf), ["/animals/mochi/main.jpg"])).toEqual({
      id: 42,
      slug: "mochi",
      name: "Mochi",
      species: "cat",
      ageGroup: "baby",
      size: "small",
      sex: "female",
      goodWith: ["cats", "kids"],
      personality: "Curious and playful.",
      status: "available",
      photos: ["/animals/mochi/main.jpg"],
    });
  });

  it("passes the downloaded photo paths through in order", () => {
    const photos = ["/animals/mochi/main.jpg", "/animals/mochi/photo-2.jpg"];
    expect(mapToAnimal(raw(goodAcf), photos).photos).toEqual(photos);
  });

  it("decodes HTML entities in the title and trims it", () => {
    const fancy = mapToAnimal(raw(goodAcf, { title: { rendered: " Sir Barks&#8217;s &amp; Co &#x1F415; " } }), []);
    expect(fancy.name).toBe("Sir Barks’s & Co \u{1F415}");
  });

  it("drops unknown good_with values and tolerates a missing or non-array value", () => {
    expect(mapToAnimal(raw({ ...goodAcf, good_with: ["dogs", "horses", 3] }), []).goodWith).toEqual(["dogs"]);
    expect(mapToAnimal(raw({ ...goodAcf, good_with: undefined }), []).goodWith).toEqual([]);
    expect(mapToAnimal(raw({ ...goodAcf, good_with: "dogs" }), []).goodWith).toEqual([]);
    expect(mapToAnimal(raw({ ...goodAcf, good_with: false }), []).goodWith).toEqual([]);
  });

  it("uses an empty personality when it is missing or not text", () => {
    expect(mapToAnimal(raw({ ...goodAcf, personality: undefined }), []).personality).toBe("");
    expect(mapToAnimal(raw({ ...goodAcf, personality: null }), []).personality).toBe("");
  });

  describe("invalid ACF values", () => {
    it.each([
      ["species", { species: "hamster" }],
      ["species (missing)", { species: undefined }],
      ["age_group", { age_group: "ancient" }],
      ["size", { size: "huge" }],
      ["size (wrong type)", { size: 3 }],
      ["sex", { sex: "other" }],
      ["adoption_status", { adoption_status: "reserved" }],
      ["adoption_status (null)", { adoption_status: null }],
    ])("throws a clear error for a bad %s", (_label, override) => {
      expect(() => mapToAnimal(raw({ ...goodAcf, ...override }), [])).toThrow(/field "/);
    });

    it("names the field and the allowed values in the error", () => {
      expect(() => mapToAnimal(raw({ ...goodAcf, species: "hamster" }), [])).toThrow(
        'field "species" is "hamster", expected one of dog | cat',
      );
    });

    it("throws when WordPress sends acf as [] (PHP's empty array) because required fields are missing", () => {
      expect(() => mapToAnimal(raw([]), [])).toThrow(/field "species"/);
    });

    it("throws when acf is missing entirely", () => {
      expect(() => mapToAnimal(raw(undefined), [])).toThrow(/field "species"/);
    });
  });
});

describe("resolveAcfImageUrl (photo_2 / photo_3 field values)", () => {
  afterEach(() => vi.unstubAllGlobals());

  /** Stubs fetch with a media endpoint that answers with the given source_url, or an error status. */
  function stubMedia(response: { source_url?: string } | number) {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      typeof response === "number"
        ? new Response("", { status: response, statusText: "Error" })
        : new Response(JSON.stringify(response), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("returns the url of an ACF image object", async () => {
    const fetchMock = stubMedia({});
    expect(await resolveAcfImageUrl({ id: 5, url: "http://wp.local/uploads/a.jpg" })).toBe("http://wp.local/uploads/a.jpg");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts source_url on an object (REST media shape)", async () => {
    expect(await resolveAcfImageUrl({ source_url: "http://wp.local/uploads/b.jpg" })).toBe("http://wp.local/uploads/b.jpg");
  });

  it("looks up the media url when the object only has an id", async () => {
    stubMedia({ source_url: "http://wp.local/uploads/c.jpg" });
    expect(await resolveAcfImageUrl({ id: 9 })).toBe("http://wp.local/uploads/c.jpg");
  });

  it("looks up the media url for a numeric ID, and for an ID sent as a string", async () => {
    const fetchMock = stubMedia({ source_url: "http://wp.local/uploads/d.jpg" });
    expect(await resolveAcfImageUrl(12)).toBe("http://wp.local/uploads/d.jpg");
    expect(await resolveAcfImageUrl("12")).toBe("http://wp.local/uploads/d.jpg");
    expect(String(fetchMock.mock.calls[0][0])).toContain("/wp/v2/media/12");
  });

  it("returns a URL string as is", async () => {
    const fetchMock = stubMedia({});
    expect(await resolveAcfImageUrl("http://wp.local/uploads/e.jpg")).toBe("http://wp.local/uploads/e.jpg");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([false, null, undefined, "", 0])("returns null for an empty value (%s)", async (value) => {
    expect(await resolveAcfImageUrl(value)).toBeNull();
  });

  it.each([true, [], {}, { url: "" }, { id: "nope" }])("returns null for an unusable value (%j)", async (value) => {
    stubMedia({});
    expect(await resolveAcfImageUrl(value)).toBeNull();
  });

  it("returns null when the media item was deleted (404)", async () => {
    stubMedia(404);
    expect(await resolveAcfImageUrl(99)).toBeNull();
  });

  it("returns null when the media record has no source_url", async () => {
    stubMedia({});
    expect(await resolveAcfImageUrl(99)).toBeNull();
  });

  it("fails loudly when WordPress can't be reached at all, rather than silently dropping photos", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));
    await expect(resolveAcfImageUrl(99)).rejects.toThrow(/Cannot reach WordPress/);
  });
});
