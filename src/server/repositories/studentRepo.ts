import { PromoteStudentsMap } from "~/data/types";

export const seasonRepo = {
  promoteStudents(promotionMap: PromoteStudentsMap, repeatersIds: number[]) {
    // promote students while ignoring the repeaters & managing the graduating ones
    // get graduating classes in this syntax (1, 4)
    const formattedGraduatingClassIds = Object.entries(promotionMap)
      .filter(([from, to]) => to === -1)
      .map(([from]) => `(${from})`)
      .join(",");
    // get promotion map to this syntax (1, 4)
    const formattedPromotionMap = Object.entries(promotionMap)
      .filter(([from, to]) => to !== -1)
      .map((arr) => {
        const [from, to] = arr;
        if (to !== -1) return `(${from} , ${to})`;
      })
      .join(",");
    //transform the repeater ids to this syntax (101), (205), (309)for sql query
    const formattedRepeatersIds = repeatersIds.map((id) => `(${id})`).join(",");
    
  },
};
