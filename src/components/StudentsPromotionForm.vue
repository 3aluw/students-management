<template>
  <div class="flex  gap-8 mt-6">
    <p class="text-xl font-bold w-1/3">نقل تلاميذ قسم</p>
    <p class="text-xl font-bold w-full">إلى قسم</p>
  </div>
  <div class="flex gap-8 my-2 items-center " v-for="classObj in studentStore.classOptions">
    <span class="whitespace-nowrap w-1/3">{{ classObj.label }}</span>
    <Select :options="classesWithGraduationClass" optionLabel="label" optionValue="value"
      v-model="promotionMapObject[classObj.value]" placeholder="اختر الصف" fluid />
  </div>

</template>
<script setup lang="ts">
import type { Class, ClassPromotionMap } from '~/data/types';
import { useStudentStore } from '~/store/studentStore';
import { toGraduateClass } from '~/data/static';
const studentStore = useStudentStore()

const classesWithGraduationClass = computed(() => {
  return [...studentStore.classOptions, { id: toGraduateClass.id, label: toGraduateClass.section, value: toGraduateClass.id }];
});




const createPromotionMap = (classes: Class[]) => {
  //create a map of grade and corresponding classes
  const classesByGrade = new Map<number, Class[]>();
  for (const c of classes) {
    if (!classesByGrade.has(c.grade)) {
      classesByGrade.set(c.grade, []);
    }
    classesByGrade.get(c.grade)!.push(c);
  }

  const promotionObject: ClassPromotionMap = {};
  //iterate over each class and find a class in the next grade to promote to
  for (const currentClass of classes) {
    let promoteToClassId: number;
    const nextGradeClasses = classesByGrade.get(currentClass.grade + 1);
    //(manage those who graduate) : if next grade doesn't exist assign promote class to toGraduateClass.id
    if (!nextGradeClasses || nextGradeClasses.length === 0) {
      promoteToClassId = toGraduateClass.id;
    }
    else {
      const sameSection = nextGradeClasses.find(
        c => c.section === currentClass.section
      )?.id;
      promoteToClassId =
        sameSection ??
        nextGradeClasses[Math.floor(Math.random() * nextGradeClasses.length)].id;
    }
    // try to find a class in the next grade with the same section, if not found, randomly assign to any class in the next grade
    promotionObject[currentClass.id] = promoteToClassId;
  }

  return promotionObject;
};

const promotionMapObject = createPromotionMap(studentStore.classes);
defineExpose({ promotionMapObject })

</script>