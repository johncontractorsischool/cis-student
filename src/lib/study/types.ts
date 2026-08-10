export type StudyLanguage = "en" | "es";
export type CourseMedium = "video" | "audio";

export type StudyCourseAccess = {
  classificationId: string;
  isDemo: boolean;
  language: StudyLanguage;
  medium: CourseMedium;
  title: string;
};

export type StudyCourseOption = StudyCourseAccess & {
  completedCount: number;
  endDate: string | null;
  totalCount: number;
};

export type StudyCourseCatalogue = {
  activeCourses: StudyCourseOption[];
  expiredCourses: StudyCourseOption[];
  language: StudyLanguage;
  medium: CourseMedium;
  message: string;
};

export type MediaLesson = {
  id: string;
  title: string;
  watched: boolean;
};

export type MediaSection = {
  id: string;
  lessons: MediaLesson[];
  title: string;
};

export type MediaCourse = StudyCourseAccess & {
  completedCount: number;
  redirectUrl: string;
  sections: MediaSection[];
  totalCount: number;
};

export type VideoLessonDetail = {
  asset: {
    redirect: boolean;
    redirectUrl: string;
    thumbnailUrl: string;
    videoUrl: string;
  };
  classId: string;
  id: string;
  language: StudyLanguage;
  nextId: string | null;
  previousId: string | null;
  title: string;
};

export type AudioLesson = MediaLesson & {
  classId: string;
  nextId: string | null;
  previousId: string | null;
  sourceUrl: string;
};

export type AudioCourse = Omit<MediaCourse, "sections"> & {
  sections: Array<Omit<MediaSection, "lessons"> & { lessons: AudioLesson[] }>;
};
