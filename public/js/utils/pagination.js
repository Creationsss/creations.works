export function createPaginatedGrid({
	gridId,
	paginationId,
	pageSize,
	renderGrid,
	matchItem,
}) {
	let data = [];
	let filtered = null;
	let currentPage = 1;

	function activeData() {
		return filtered ?? data;
	}

	function renderPage() {
		const grid = document.getElementById(gridId);
		const pagination = document.getElementById(paginationId);
		if (!grid) return;

		const list = activeData();
		const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
		if (currentPage > totalPages) currentPage = totalPages;

		const start = (currentPage - 1) * pageSize;
		const pageItems = list.slice(start, start + pageSize);

		renderGrid(grid, pageItems);

		if (!pagination) return;

		if (filtered !== null || totalPages <= 1) {
			pagination.style.display = "none";
			pagination.replaceChildren();
			return;
		}

		pagination.style.display = "";
		pagination.replaceChildren(
			makeBtn("prev", currentPage - 1, currentPage <= 1),
			makeInfo(currentPage, totalPages),
			makeBtn("next", currentPage + 1, currentPage >= totalPages),
		);
	}

	function makeBtn(label, page, disabled) {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "pagination-btn";
		btn.dataset.page = String(page);
		btn.disabled = disabled;
		btn.textContent = label;
		return btn;
	}

	function makeInfo(current, total) {
		const span = document.createElement("span");
		span.className = "pagination-info";
		span.textContent = `${current} / ${total}`;
		return span;
	}

	function goToPage(page) {
		const list = activeData();
		const totalPages = Math.ceil(list.length / pageSize);
		if (page < 1 || page > totalPages) return;
		currentPage = page;
		renderPage();

		const grid = document.getElementById(gridId);
		if (grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
	}

	function filter(term) {
		const trimmed = term.trim().toLowerCase();
		if (!trimmed) {
			filtered = null;
		} else {
			filtered = data.filter((item) => matchItem(item, trimmed));
		}
		currentPage = 1;
		renderPage();
	}

	function attach(parent = document) {
		parent.addEventListener("click", (e) => {
			const btn = e.target.closest(`#${paginationId} .pagination-btn`);
			if (btn && !btn.disabled) {
				const page = Number(btn.dataset.page);
				if (Number.isInteger(page)) goToPage(page);
			}
		});
	}

	return {
		setData(nextData) {
			data = nextData;
			filtered = null;
			currentPage = 1;
			renderPage();
		},
		render: renderPage,
		filter,
		attach,
	};
}
