import { FeaturedAnimals } from "@/components/home/FeaturedAnimals";
import { Hero } from "@/components/home/Hero";
import { HowAdoptionWorks } from "@/components/home/HowAdoptionWorks";
import { allAnimals } from "@/lib/animal-data";

export default function Home() {
  // allAnimals is already sorted; the hero shows the first available animal
  // and the row below shows the next three, so nobody appears twice.
  const [spotlight, ...rest] = allAnimals.filter((animal) => animal.status === "available");

  return (
    <>
      <Hero spotlight={spotlight} />
      <FeaturedAnimals animals={rest.slice(0, 3)} />
      <HowAdoptionWorks />
    </>
  );
}
