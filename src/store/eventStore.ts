import { defineStore, acceptHMRUpdate } from "pinia";
import type {
  Lateness,
  Absence,
  LocalAbsence,
  EventQueryFilters,
  LocalLateness,
} from "~/data/types";
export const useEventStore = defineStore("eventStore", () => {
  const backend = useBackend();

  const lateness = ref<LocalLateness[]>([]);
  const absences = ref<LocalAbsence[]>([]);

  const populateAbsences = async (query: EventQueryFilters) => {
    const { absences: dbAbsences, total } = await backend.getAbsences(query);
    absences.value = dbAbsences;
    return total;
  };
  const populateLateness = async (query: EventQueryFilters) => {
    const { lateness: dbLateness, total } = await backend.getLateness(query);
    lateness.value = dbLateness;
    return total;
  };

  return { lateness, absences, populateAbsences, populateLateness };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEventStore, import.meta.hot));
}
