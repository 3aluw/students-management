import { defineStore, acceptHMRUpdate } from "pinia";
import type { Class, Student } from "~/data/types";
import { ArabicSchoolLevels } from "~/data/static";
export const useStudentStore = defineStore("studentStore", () => {
  const backend = useBackend();

  const classes = ref<Class[]>([]);
  const students = ref<Student[]>([]);
  const selectedClassId = ref<number>()
  const searchedStudents = ref<Student[]>([]);

  const populateClasses = async () => {
    classes.value = await backend.getClasses();
  };
  const populateStudents = async (classId?: number) => {
    if(!classId) classId = selectedClassId.value ?? classes.value[0].id
    try{
      students.value = await backend.getStudentsByClass(classId);
      selectedClassId.value = classId
    }catch(err){
      console.log(err);
    }
  };

  const classOptions = computed(() => {
    return classes.value.map((cls) => ({
      label:
        cls.grade +
        " " +
        ArabicSchoolLevels[cls.school_level] +
        " " +
        cls.section,
      value: cls.id,
    }));
  });
  return {
    classes,
    students,
    selectedClassId,
    searchedStudents,
    populateClasses,
    populateStudents,
    classOptions,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStudentStore, import.meta.hot));
}
