export type TestType = 'sprint_100m' | 'sprint_200m' | 'sprint_400m' | 'long_jump' | 'high_jump' | 'shot_put' | 'vertical_jump' | 'beep_test';

export interface Student {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  grade: string;
  primarySport: string;
  teacherId: string;
  createdAt: any; // Firestore Timestamp
  photoUrl?: string;
}

export const COMMON_SPORTS = [
  'Athletics',
  'Kabaddi',
  'Football',
  'Basketball',
  'Volleyball',
  'Cricket',
  'Badminton',
  'Wrestling',
  'Swimming',
];

export interface PerformanceLog {
  id: string;
  studentId: string;
  testType: TestType;
  value: number; // seconds for sprint, meters for jumps/throws, count for others
  timestamp: any; // Firestore Timestamp
  teacherId: string;
}

export interface Benchmark {
  testType: TestType;
  level: 'District' | 'State' | 'National';
  threshold: number;
  label: string;
}

export interface CoachProfile {
  schoolName: string;
  bio?: string;
  updatedAt: any;
}

export const BENCHMARKS: Benchmark[] = [
  { testType: 'sprint_100m', level: 'District', threshold: 13.5, label: 'District Level Ready' },
  { testType: 'sprint_100m', level: 'State', threshold: 12.5, label: 'State Level Ready' },
  { testType: 'sprint_100m', level: 'National', threshold: 11.5, label: 'National Level Ready' },
  { testType: 'sprint_200m', level: 'District', threshold: 28.0, label: 'District Level Ready' },
  { testType: 'sprint_200m', level: 'State', threshold: 26.0, label: 'State Level Ready' },
  { testType: 'long_jump', level: 'District', threshold: 4.5, label: 'District Level Ready' },
  { testType: 'long_jump', level: 'State', threshold: 5.5, label: 'State Level Ready' },
  { testType: 'high_jump', level: 'District', threshold: 1.2, label: 'District Level Ready' },
  { testType: 'high_jump', level: 'State', threshold: 1.4, label: 'State Level Ready' },
  { testType: 'shot_put', level: 'District', threshold: 8.0, label: 'District Level Ready' },
  { testType: 'shot_put', level: 'State', threshold: 10.0, label: 'State Level Ready' },
  { testType: 'vertical_jump', level: 'District', threshold: 40, label: 'District Level Ready' },
  { testType: 'vertical_jump', level: 'State', threshold: 55, label: 'State Level Ready' },
];
