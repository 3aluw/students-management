import { useStudentStore } from "~/store/studentStore";

// It populates the store with initial data when the app starts
export default defineNuxtPlugin(async () => {
  const studentStore = useStudentStore();
  await studentStore.populateClasses();
});
