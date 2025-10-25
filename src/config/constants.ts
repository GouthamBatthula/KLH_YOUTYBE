export const SUBJECTS = [
  "CSE",
  "AI-DS",
  "ECE",
] as const;

export const SEMESTERS = ["1-Odd", "1-even","2-Odd", "2-even","3-Odd", "3-even",
  "4-Odd", "4-even",
] as const;

export type Subject = typeof SUBJECTS[number];
export type Semester = typeof SEMESTERS[number];