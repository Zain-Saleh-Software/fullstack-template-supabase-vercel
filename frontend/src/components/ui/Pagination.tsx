interface PaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null

    const pages: (number | '...')[] = []
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            pages.push(i)
        } else if (pages[pages.length - 1] !== '...') {
            pages.push('...')
        }
    }

    return (
        <nav className="mt-6 flex items-center justify-center gap-1" aria-label="Pagination">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label="Previous page"
            >
                &laquo; Prev
            </button>
            {pages.map((page, i) =>
                page === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-gray-400 dark:text-gray-500">
                        ...
                    </span>
                ) : (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`rounded-md border px-3 py-1.5 text-sm ${
                            page === currentPage
                                ? 'border-blue-500 bg-blue-500 text-white dark:border-blue-600 dark:bg-blue-600'
                                : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                        }`}
                        aria-current={page === currentPage ? 'page' : undefined}
                    >
                        {page}
                    </button>
                ),
            )}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label="Next page"
            >
                Next &raquo;
            </button>
        </nav>
    )
}
