/* A store for user preferences and analytics */
import { defineStore, acceptHMRUpdate } from "pinia";
import type { SchoolSeason } from "~/data/types";

export const useClientStore = defineStore("clientStore", () => {
  const backend = useBackend();
const seasons = ref<SchoolSeason[]>([]);
  const populateSeasons = async () => {
    seasons.value = await backend.getSeasons();

  }

  return {seasons,
    populateSeasons
  }
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useClientStore, import.meta.hot));
}
