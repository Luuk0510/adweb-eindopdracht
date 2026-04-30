export type Category = {
  id: string;
  bookId: string;
  name: string;
  maxBudget: number;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};