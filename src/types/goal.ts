/** A reading goal for one calendar year — at most one row per year, keyed by year. Either target is optional so a goal can track books only, pages only, or both. */
export interface ReadingGoal {
  year: number
  booksTarget?: number
  pagesTarget?: number
}
