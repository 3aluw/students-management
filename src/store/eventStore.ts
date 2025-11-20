import { defineStore, acceptHMRUpdate } from "pinia";
import type { Lateness, Absence, LocalAbsence, EventQueryFilters } from "~/data/types";
import { ArabicSchoolLevels } from "~/data/static";
export const useEventStore = defineStore("eventStore", () => {
  const backend = useBackend();

  const lateness = ref<Lateness[]>([]);
  const absences = ref<LocalAbsence[]>([]);

  const populateAbsences = async (query: EventQueryFilters) => {
    absences.value = await backend.getAbsences(query);
  };
  return { lateness, absences, populateAbsences };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEventStore, import.meta.hot));
}
