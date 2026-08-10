import type { StudyLanguage } from "@/lib/study/types";

export type LiveClassSessionStatus = "archive" | "live" | "pre_recorded";

export type LiveClassSession = {
  destinationUrl: string;
  id: string;
  status: LiveClassSessionStatus;
  title: string;
};

export type LiveClassSection = {
  id: string;
  sessions: LiveClassSession[];
  title: string;
};

export type LiveClassCatalogue = {
  announcement: { description: string; title: string } | null;
  fallbackUrl: string;
  isLive: boolean;
  language: StudyLanguage;
  sections: LiveClassSection[];
};

export type LiveClassVideoDetail = {
  asset: {
    redirect: boolean;
    redirectUrl: string;
    thumbnailUrl: string;
    videoUrl: string;
  };
  categoryTitle: string;
  id: string;
  language: StudyLanguage;
  status: LiveClassSessionStatus;
  title: string;
};
