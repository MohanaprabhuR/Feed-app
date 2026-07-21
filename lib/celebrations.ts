import type { CelebrationOccasion } from "@/lib/types";

export const CELEBRATION_OCCASIONS: {
  value: CelebrationOccasion;
  label: string;
  emoji: string;
}[] = [
  { value: "new-job", label: "New job", emoji: "🎉" },
  { value: "work-anniversary", label: "Work anniversary", emoji: "🎊" },
  { value: "promotion", label: "Promotion", emoji: "🚀" },
  { value: "certification", label: "New certification", emoji: "🎓" },
  { value: "retirement", label: "Retirement", emoji: "🌟" },
  { value: "volunteering", label: "Volunteering", emoji: "🤝" },
  { value: "other", label: "Other", emoji: "🎈" },
];

export function getCelebrationMeta(occasion: CelebrationOccasion) {
  return (
    CELEBRATION_OCCASIONS.find((item) => item.value === occasion) ??
    CELEBRATION_OCCASIONS[CELEBRATION_OCCASIONS.length - 1]
  );
}
