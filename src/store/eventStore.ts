import { defineStore, acceptHMRUpdate } from "pinia";
import type { Lateness, Absence, LocalAbsence, EventQueryFilters } from "~/data/types";
import { ArabicSchoolLevels } from "~/data/static";
export const useEventStore = defineStore("eventStore", () => {
  const backend = useBackend();

  const lateness = ref<Lateness[]>([]);
  const absences = ref<LocalAbsence[]>([]);

  const populateAbsences = async (query: EventQueryFilters) => {
    const {absences : dbAbsences, total} = await backend.getAbsences(query);
    absences.value = dbAbsences;
    return total;
  };
  return { lateness, absences, populateAbsences };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEventStore, import.meta.hot));
}
