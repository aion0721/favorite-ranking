export type RankingItem = {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  entries: {
    id: string;
    name: string;
    votes: number;
  }[];
  createdAt: string;
};
