"use client";

import { DragEvent, useState } from "react";
import { Category } from "@/types/category";

type CategoryDropZoneProps = {
  categories: Category[];
  onDropAction: (transactionId: string, categoryId: string | null) => void;
};

export function CategoryDropZone({
  categories,
  onDropAction,
}: CategoryDropZoneProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<
    string | null | undefined
  >(undefined);

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
    categoryId: string | null,
  ) {
    event.preventDefault();
    setActiveCategoryId(undefined);

    const transactionId = event.dataTransfer.getData("transactionId");

    if (transactionId) {
      onDropAction(transactionId, categoryId);
    }
  }

  function handleDragOver(
    event: DragEvent<HTMLDivElement>,
    categoryId: string | null,
  ) {
    event.preventDefault();
    setActiveCategoryId(categoryId);
  }

  return (
    <article className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">
        Sleep naar categorie
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Sleep een transactie naar een categorie om deze te koppelen.
      </p>

      <div className="mt-4 space-y-3">
        <div
          className={`rounded-xl border border-dashed p-4 text-sm transition ${
            activeCategoryId === null
              ? "border-slate-500 bg-white"
              : "border-slate-300 bg-white"
          }`}
          onDragLeave={() => setActiveCategoryId(undefined)}
          onDragOver={(event) => handleDragOver(event, null)}
          onDrop={(event) => handleDrop(event, null)}
        >
          Geen categorie
        </div>

        {categories.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
            Maak eerst categorieën aan om transacties eraan te koppelen.
          </p>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className={`rounded-xl border border-dashed p-4 text-sm transition ${
                activeCategoryId === category.id
                  ? "border-slate-500 bg-white"
                  : "border-slate-300 bg-white"
              }`}
              onDragLeave={() => setActiveCategoryId(undefined)}
              onDragOver={(event) => handleDragOver(event, category.id)}
              onDrop={(event) => handleDrop(event, category.id)}
            >
              {category.name}
            </div>
          ))
        )}
      </div>
    </article>
  );
}
