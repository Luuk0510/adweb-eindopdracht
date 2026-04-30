export type Transaction = {
  id: string;
  bookId: string;
  categoryId: string | null;
  type: "expense" | "income";
  title: string;
  amount: number;
  date: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};