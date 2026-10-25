export type Species = "dog" | "cat";
export type AgeGroup = "baby" | "young" | "adult" | "senior";
export type Size = "small" | "medium" | "large";
export type Sex = "male" | "female";
export type GoodWith = "dogs" | "cats" | "kids";
export type AdoptionStatus = "available" | "pending" | "adopted";

export type Animal = {
  id: number;
  slug: string;
  name: string;
  species: Species;
  ageGroup: AgeGroup;
  size: Size;
  sex: Sex;
  goodWith: GoodWith[];
  personality: string;
  status: AdoptionStatus;
  /** Local public paths (e.g. "/animals/earl-grey/main.jpg"); first entry is the main photo. */
  photos: string[];
};
