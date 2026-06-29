import { defineStore, acceptHMRUpdate } from "pinia";
import type {
  LocalAbsence,
  EventQueryFilters,
  LocalLateness,
  LocalInfraction,
} from "~/models/types";
export const useEventStore = defineStore("eventStore", () => {
  const backend = useBackend();

  const lateness = ref<LocalLateness[]>([]);
  const absences = ref<LocalAbsence[]>([]);
  const infractions = ref<LocalInfraction[]>([]);

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
  const populateInfractions = async (query: EventQueryFilters) => {
    const { infractions: dbInfraction, total } =
      await backend.getInfractions(query);
    infractions.value = dbInfraction;
    return total;
  };

  return {
    lateness,
    absences,
    infractions,
    populateAbsences,
    populateLateness,
    populateInfractions,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEventStore, import.meta.hot));
}
