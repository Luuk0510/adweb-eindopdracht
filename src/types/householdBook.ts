export type HouseholdBook = {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  participantIds: string[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};
