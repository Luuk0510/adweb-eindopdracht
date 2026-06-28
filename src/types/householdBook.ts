export type HouseholdBook = {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  participantIds: string[];
  participantEmails: Record<string, string>;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};
