"use client";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useFinancialData } from "@/hooks/useFinancialData";
import { useTransactionForm } from "@/hooks/useTransactionForm";

import { CategoryExpenseBarChart } from "@/components/household-books/detail/CategoryExpenseBarChart";
import { CategoryDropZone } from "@/components/household-books/detail/CategoryDropZone";
import { FinancialSummaryCards } from "@/components/household-books/detail/FinancialSummaryCards";
import { MonthlyBalanceChart } from "@/components/household-books/detail/MonthlyBalanceChart";
import { TransactionForm } from "@/components/household-books/detail/TransactionForm";
import { TransactionList } from "@/components/household-books/detail/TransactionList";
import { SecondaryLink } from "@/components/ui/SecondaryButton";

import {
  formatCurrency,
  formatDate,
  getMonthLabel,
} from "@/utils/financialCalculations";

type FinancialOverviewProps = {
  bookId: string;
  title: string;
  description: string;
  categoryOverviewHref: string;
  canManage: boolean;
};

export function FinancialOverview({
  bookId,
  title,
  description,
  categoryOverviewHref,
  canManage,
}: FinancialOverviewProps) {
  const { user, isCheckingAuth } = useAuthRedirect();

  const {
    transactions,
    setTransactions,
    categories,
    setSelectedMonth,
    isLoading,
    errorMessage,
    availableMonths,
    monthlyChartData,
    effectiveMonth,
    monthlyTransactions,
    categoryExpenseData,
    summaryCards,
    refreshTransactions,
  } = useFinancialData(bookId, user);

  const {
    transactionTitle,
    transactionAmount,
    transactionType,
    transactionCategoryId,
    transactionDate,
    editingTransactionId,
    transactionErrorMessage,
    setTransactionTitle,
    setTransactionAmount,
    setTransactionType,
    setTransactionCategoryId,
    setTransactionDate,
    resetTransactionForm,
    handleTransactionSubmit,
    startEditingTransaction,
    handleDeleteTransaction,
    handleDropTransactionOnCategory,
  } = useTransactionForm({
    bookId,
    user,
    transactions,
    setTransactions,
    refreshTransactions,
    setSelectedMonth,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    if (!event.over) {
      return;
    }

    const transactionId = String(event.active.id);
    const dropZoneId = String(event.over.id);

    if (!dropZoneId.startsWith("category:")) {
      return;
    }

    const categoryId = dropZoneId.replace("category:", "") || null;
    void handleDropTransactionOnCategory(transactionId, categoryId);
  }

  if (isCheckingAuth || isLoading) {
    return (
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          {description}
        </p>
        <p className="mt-6 text-sm text-slate-500">Overzicht laden...</p>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-8 text-rose-900 shadow-sm">
        <h1 className="text-2xl font-semibold">Overzicht niet beschikbaar</h1>
        <p className="mt-2 text-sm">{errorMessage}</p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            {description}
          </p>

          <div className="mt-4">
            <SecondaryLink href={categoryOverviewHref}>
              Categorie overzicht
            </SecondaryLink>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="rounded-xl border border-slate-200 p-3 sm:w-56">
            <label
              className="text text-black"
              htmlFor="month-select"
            >
              Bekijk per maand
            </label>
            <select
              id="month-select"
              value={effectiveMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            >
              {availableMonths.length > 0 ? (
                availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {getMonthLabel(month)}
                  </option>
                ))
              ) : (
                <option value={effectiveMonth}>
                  {getMonthLabel(effectiveMonth)}
                </option>
              )}
            </select>
          </div>
        </div>
      </div>

      <FinancialSummaryCards cards={summaryCards} />

      <div className="grid gap-6 xl:grid-cols-2">
        <MonthlyBalanceChart
          monthlyChartData={monthlyChartData}
          formatCurrency={formatCurrency}
        />

        <CategoryExpenseBarChart
          categoryExpenseData={categoryExpenseData}
          formatCurrency={formatCurrency}
        />
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div
          className={
            canManage
              ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"
              : "grid gap-6"
          }
        >
          <div>
            <TransactionList
              transactions={monthlyTransactions}
              categories={categories}
              effectiveMonth={effectiveMonth}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
              canManage={canManage}
              onEditAction={startEditingTransaction}
              onDeleteAction={handleDeleteTransaction}
            />
          </div>

          {canManage && (
            <aside className="lg:sticky lg:top-6 lg:self-start">
              <TransactionForm
                title={transactionTitle}
                amount={transactionAmount}
                type={transactionType}
                categoryId={transactionCategoryId}
                categories={categories}
                date={transactionDate}
                editingTransactionId={editingTransactionId}
                errorMessage={transactionErrorMessage}
                onTitleChange={setTransactionTitle}
                onAmountChange={setTransactionAmount}
                onTypeChange={setTransactionType}
                onCategoryChange={setTransactionCategoryId}
                onDateChange={setTransactionDate}
                onSubmitAction={handleTransactionSubmit}
                onCancelAction={resetTransactionForm}
              />

              <CategoryDropZone categories={categories} />
            </aside>
          )}
        </div>
      </DndContext>
    </section>
  );
}
