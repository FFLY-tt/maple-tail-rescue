import { Hero } from "@/components/home/Hero";
import { HowAdoptionWorks } from "@/components/home/HowAdoptionWorks";
import { allAnimals } from "@/lib/animal-data";

export default function Home() {
  // allAnimals is already sorted (available, then pending); adopted animals aren't looking for homes.
  const carouselAnimals = allAnimals.filter((animal) => animal.status !== "adopted");

  return (
    <>
      <Hero animals={carouselAnimals} />
      <HowAdoptionWorks />
    </>
  );
}
