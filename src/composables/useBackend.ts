import type { Class } from "~/data/types";

export default function () {
  const getClasses = () => {
    return $fetch<Class[]>("/api/classes");
  };

  return {
    getClasses,
  };
}
