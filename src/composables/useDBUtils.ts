import type { AllEntitiesUnion } from "../data/types"; 
export default function(){
     const generateDBSetClause = <T extends AllEntitiesUnion>(object: T) => {
    // fields is an object like { name: 'Alice', age: 30, status: 'active' }
    const keys = Object.keys(object) as (keyof object)[];
    // Create "col1 = ?, col2 = ?, ..." for the SQL
    return keys.map((key) => `${key} = ?`).join(", ");
  };
  return{
  generateDBSetClause
  }
}