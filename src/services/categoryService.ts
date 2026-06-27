import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  QueryDocumentSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  rethrowFriendlyFirestoreError,
  toDate,
} from "@/services/firestoreHelpers";
import {
  getHouseholdBookById,
  getOwnedHouseholdBookById,
} from "@/services/householdBookService";
import { Category } from "@/types/category";

const categoriesCollection = collection(db, "categories");
const categoriesCache = new Map<string, Category[]>();

function clearCategoriesCache(bookId: string) {
  categoriesCache.delete(bookId);
}

function mapCategory(documentId: string, data: DocumentData): Category {
  return {
    id: documentId,
    bookId: data.bookId ?? "",
    name: data.name ?? "Onbekende categorie",
    maxBudget: typeof data.maxBudget === "number" ? data.maxBudget : 0,
    endDate: data.endDate ? toDate(data.endDate) : null,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function getCategoryName(name: string) {
  return name.trim().slice(0, 50);
}

export async function getCategoriesByHouseholdBookId(
  bookId: string,
  userId: string,
): Promise<Category[]> {
  try {
    const cachedCategories = categoriesCache.get(bookId);

    if (cachedCategories) {
      return cachedCategories;
    }

    const book = await getHouseholdBookById(bookId, userId);

    if (!book) {
      throw new Error("Huishoudboekje niet gevonden.");
    }

    const categoriesQuery = query(
      categoriesCollection,
      where("bookId", "==", bookId),
    );

    const snapshot = await getDocs(categoriesQuery);

    const categories = snapshot.docs
      .map((categoryDocument: QueryDocumentSnapshot<DocumentData>) =>
        mapCategory(categoryDocument.id, categoryDocument.data()),
      )
      .sort((firstCategory, secondCategory) => {
        return firstCategory.name.localeCompare(secondCategory.name);
      });

    categoriesCache.set(bookId, categories);

    return categories;
  } catch (error) {
    rethrowFriendlyFirestoreError(error);
  }
}

export async function createCategory(
  bookId: string,
  userId: string,
  name: string,
  maxBudget: number,
  endDate: Date | null,
) {
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

  await getOwnedHouseholdBookById(
    bookId,
    userId,
    "Alleen de eigenaar mag categorieën toevoegen.",
  );

  const categoryReference = await addDoc(categoriesCollection, {
    bookId,
    name: categoryName,
    maxBudget,
    endDate,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  clearCategoriesCache(bookId);

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

  await getOwnedHouseholdBookById(
    bookId,
    userId,
    "Alleen de eigenaar mag categorieën aanpassen.",
  );

  const categoryReference = doc(db, "categories", categoryId);
  const categorySnapshot = await getDoc(categoryReference);

  if (!categorySnapshot.exists()) {
    throw new Error("Categorie bestaat niet.");
  }

  if ((categorySnapshot.data().bookId ?? "") !== bookId) {
    throw new Error("Categorie hoort niet bij dit huishoudboekje.");
  }

  await updateDoc(categoryReference, {
    name: categoryName,
    maxBudget,
    endDate,
    updatedAt: serverTimestamp(),
  });

  clearCategoriesCache(bookId);
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

  const categoryReference = doc(db, "categories", categoryId);
  const categorySnapshot = await getDoc(categoryReference);

  if (!categorySnapshot.exists()) {
    throw new Error("Categorie bestaat niet.");
  }

  if ((categorySnapshot.data().bookId ?? "") !== bookId) {
    throw new Error("Categorie hoort niet bij dit huishoudboekje.");
  }

  await deleteDoc(categoryReference);

  clearCategoriesCache(bookId);
}
