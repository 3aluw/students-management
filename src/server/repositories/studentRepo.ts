import useDBUtils from "~/composables/useDBUtils";
import { ClassPromotionMap } from "~/data/types";
import db from "~/db/db";

const { generateSqlCTEValues } = useDBUtils();

export const studentRepo = {
  async handlesStudentsPromotion(
    promotionMap: ClassPromotionMap,
    repeatersIds: number[],
  ) {
    // ==========  promote students while ignoring the repeaters & managing the graduating ones ==========

    // get graduating classes then write them in this sql syntax (1, 4)
    const graduatingClassIds = Object.entries(promotionMap)
      .filter(([from, to]) => to === -1)
      .map(([from, to]) => Number(from));
    const formattedGraduatingClassIds = generateSqlCTEValues(
      graduatingClassIds,
      1,
    );

    // get pure promotion map (without graduating classes) then write them in this sql syntax  (1, 4)
    const purePromotionMap = Object.entries(promotionMap).filter(
      ([from, to]) => to !== -1,
    );
    const formattedPromotionMap = generateSqlCTEValues(purePromotionMap, 2);

    //transform the repeater ids to this syntax (101), (205), (309)for sql query
    const formattedRepeatersIds = generateSqlCTEValues(repeatersIds, 1);

    const sql = `
WITH 
graduatingClassIds(class_id) AS (
  VALUES ${formattedGraduatingClassIds}
),
promotion_map(from_class_id, to_class_id) AS (
  VALUES ${formattedPromotionMap}
),
repeaters(student_id) AS (
  VALUES ${formattedRepeatersIds}
)

UPDATE student
SET 
  class_id = CASE
    WHEN id IN (SELECT student_id FROM repeaters) THEN class_id
    WHEN class_id IN (SELECT class_id FROM graduatingClassIds) THEN NULL
    ELSE (
      SELECT to_class_id
      FROM promotion_map
      WHERE from_class_id = student.class_id
    )
  END,

    status = CASE
    WHEN id IN (SELECT student_id FROM repeaters) THEN status
    WHEN class_id IN (SELECT class_id FROM graduatingClassIds) THEN 'graduated'
    ELSE status
  END

WHERE 
  id IN (SELECT student_id FROM repeaters)
  OR class_id IN (SELECT class_id FROM graduatingClassIds)
  OR class_id IN (SELECT from_class_id FROM promotion_map);
`;
    db.exec(sql);
  },
};
