/**
 * Everything the rescue says about how adoption works. The home page, the
 * /adoption-process page and the application success screen all read from here,
 * so editing this one file updates all three. Plain text only, no markup.
 */

export type AdoptionStep = {
  title: string;
  /** Rough time the step takes for the adopter. */
  time: string;
  /** One line on what happens and why. */
  reason: string;
};

export const ADOPTION_STEPS: readonly AdoptionStep[] = [
  {
    title: "Apply",
    time: "About 5 minutes",
    reason: "A short application tells us about you and your home so we can suggest the right match.",
  },
  {
    title: "Chat",
    time: "About 15 minutes",
    reason:
      "A volunteer phones you to answer questions and talk through your references, so you don’t need to list them on the form.",
  },
  {
    title: "Meet",
    time: "About 1 hour",
    reason:
      "Visit the animal at their foster home and chat about your home, so everyone can see if it’s a good fit.",
  },
  {
    title: "Welcome home",
    time: "About 30 minutes, then a 2-week trial",
    reason:
      "You sign the adoption agreement, pay the adoption fee and take them home for a 2-week trial to make sure everyone settles in.",
  },
];

export const ADOPTION_PROCESS_INTRO =
  "Adopting from a foster-based rescue takes a little longer than a pet store, and that’s on purpose. Four short steps help us make sure every animal goes home to the right family.";

export const ADOPTION_FEES = {
  title: "Adoption fees",
  paragraphs: [
    "Our adoption fee helps cover vaccines, spay/neuter surgery and a microchip, so your new family member comes home healthy and ready to go.",
    "Fees vary by animal, and the amount is listed with the agreement you sign in the last step.",
  ],
};

export const ADOPTION_FAQ: readonly { question: string; answer: string }[] = [
  {
    question: "How long does the whole process take?",
    answer:
      "Most adoptions take one to two weeks from application to homecoming. It depends mostly on how quickly we can find a time for you to meet the animal at their foster home.",
  },
  {
    question: "Can I adopt if I rent?",
    answer:
      "Yes. We just ask whether your landlord allows pets, and we may ask for written permission before the adoption is finalized.",
  },
  {
    question: "Can I adopt if I already have other pets?",
    answer:
      "Yes, many of our adopters do. Tell us about your pets on the application, and we’ll look for an animal who is a good match. Some animals are happiest as the only pet, and their profile says so.",
  },
];
