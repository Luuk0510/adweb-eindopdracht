import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  onSnapshot,
  QueryDocumentSnapshot,
  QuerySnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { Observable } from "rxjs";
import { db } from "@/lib/firebase";
import {
  getHouseholdBookById,
  getOwnedHouseholdBookById,
} from "@/services/householdBookService";
import { Category } from "@/types/category";

const categoriesCollection = collection(db, "categories");

function getDate(value: { toDate?: () => Date } | Date | null | undefined) {
  if (value instanceof Date) {
    return value;
  }

  return value?.toDate?.() ?? new Date();
}

function mapCategory(documentId: string, data: DocumentData): Category {
  return {
    id: documentId,
    bookId: data.bookId ?? "",
    name: data.name ?? "Onbekende categorie",
    maxBudget: typeof data.maxBudget === "number" ? data.maxBudget : 0,
    endDate: data.endDate ? getDate(data.endDate) : null,
    createdAt: getDate(data.createdAt),
    updatedAt: getDate(data.updatedAt),
  };
}

function getCategoryName(name: string) {
  return name.trim().slice(0, 50);
}

function getCategoriesFromSnapshot(snapshot: QuerySnapshot<DocumentData>) {
  return snapshot.docs
    .map((categoryDocument: QueryDocumentSnapshot<DocumentData>) =>
      mapCategory(categoryDocument.id, categoryDocument.data()),
    )
    .sort((firstCategory, secondCategory) => {
      return firstCategory.name.localeCompare(secondCategory.name);
    });
}

function getValidCategoryInput(name: string, maxBudget: number) {
  const categoryName = getCategoryName(name);

  if (!categoryName) {
    throw new Error("Categorienaam is verplicht.");
  }

  if (!Number.isFinite(maxBudget)) {
    throw new Error("Budget is verplicht.");
  }

  if (maxBudget < 0) {
    throw new Error("Budget mag niet negatief zijn.");
  }

  return { categoryName, maxBudget };
}

async function getCategoryDocument(categoryId: string, bookId: string) {
  const categoryReference = doc(db, "categories", categoryId);
  const categorySnapshot = await getDoc(categoryReference);

  if (!categorySnapshot.exists()) {
    throw new Error("Categorie bestaat niet.");
  }

  if ((categorySnapshot.data().bookId ?? "") !== bookId) {
    throw new Error("Categorie hoort niet bij dit huishoudboekje.");
  }

  return categoryReference;
}

export async function getCategoriesByHouseholdBookId(
  bookId: string,
  userId: string,
): Promise<Category[]> {
  const book = await getHouseholdBookById(bookId, userId);

  if (!book) {
    throw new Error("Huishoudboekje niet gevonden.");
  }

  const categoriesQuery = query(
    categoriesCollection,
    where("bookId", "==", bookId),
  );

  const snapshot = await getDocs(categoriesQuery);

  return getCategoriesFromSnapshot(snapshot);
}

export function getCategoriesObservable(bookId: string) {
  const categoriesQuery = query(
    categoriesCollection,
    where("bookId", "==", bookId),
  );

  return new Observable<Category[]>((subscriber) => {
    const unsubscribe = onSnapshot(
      categoriesQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        subscriber.next(getCategoriesFromSnapshot(snapshot));
      },
      (error) => {
        subscriber.error(error);
      },
    );

    return () => unsubscribe();
  });
}

export async function createCategory(
  bookId: string,
  userId: string,
  name: string,
  maxBudget: number,
  endDate: Date | null,
) {
  const categoryInput = getValidCategoryInput(name, maxBudget);

  await getOwnedHouseholdBookById(
    bookId,
    userId,
    "Alleen de eigenaar mag categorieën toevoegen.",
  );

  const categoryReference = await addDoc(categoriesCollection, {
    bookId,
    name: categoryInput.categoryName,
    maxBudget: categoryInput.maxBudget,
    endDate,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return categoryReference;
}

export async function updateCategory(
  categoryId: string,
  bookId: string,
  userId: string,
  name: string,
  maxBudget: number,
  endDate: Date | null,
) {
  const categoryInput = getValidCategoryInput(name, maxBudget);

  await getOwnedHouseholdBookById(
    bookId,
    userId,
    "Alleen de eigenaar mag categorieën aanpassen.",
  );

  const categoryReference = await getCategoryDocument(categoryId, bookId);

  await updateDoc(categoryReference, {
    name: categoryInput.categoryName,
    maxBudget: categoryInput.maxBudget,
    endDate,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCategory(
  categoryId: string,
  bookId: string,
  userId: string,
) {
  await getOwnedHouseholdBookById(
    bookId,
    userId,
    "Alleen de eigenaar mag categorieën verwijderen.",
  );

  const categoryReference = await getCategoryDocument(categoryId, bookId);

  await deleteDoc(categoryReference);
}
