export function toDate(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate();
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsedDate = new Date(value);

    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  return new Date();
}

function isPermissionDeniedError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "permission-denied"
  );
}

export function getFriendlyFirestoreErrorMessage(error: unknown) {
  if (isPermissionDeniedError(error)) {
    return "Je hebt hier geen toegang toe. Controleer je rechten of probeer het later opnieuw.";
  }

  return null;
}

export function rethrowFriendlyFirestoreError(error: unknown): never {
  const friendlyMessage = getFriendlyFirestoreErrorMessage(error);

  if (friendlyMessage) {
    throw new Error(friendlyMessage);
  }

  throw error;
}
