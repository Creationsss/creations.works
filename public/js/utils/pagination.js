export function createPaginatedGrid({
	gridId,
	paginationId,
	pageSize,
	renderGrid,
	matchItem,
	searchableText,
	filterDebounceMs = 150,
}) {
	let data = [];
	let searchIndex = null;
	let filtered = null;
	let currentPage = 1;
	let attached = false;
	let filterTimer = null;
	let pendingTerm = "";

	let gridEl = null;
	let paginationEl = null;

	function getGrid() {
		if (gridEl?.isConnected) return gridEl;
		gridEl = document.getElementById(gridId);
		return gridEl;
	}

	function getPagination() {
		if (paginationEl?.isConnected) return paginationEl;
		paginationEl = document.getElementById(paginationId);
		return paginationEl;
	}

	function activeData() {
		return filtered ?? data;
	}

	function totalPages() {
		return Math.max(1, Math.ceil(activeData().length / pageSize));
	}

	function renderPage() {
		const grid = getGrid();
		if (!grid) return;

		const list = activeData();
		const pages = totalPages();
		if (currentPage > pages) currentPage = pages;

		const start = (currentPage - 1) * pageSize;
		const pageItems = list.slice(start, start + pageSize);

		renderGrid(grid, pageItems);

		const pagination = getPagination();
		if (!pagination) return;

		if (filtered !== null || pages <= 1) {
			pagination.style.display = "none";
			pagination.replaceChildren();
			return;
		}

		pagination.style.display = "";
		pagination.replaceChildren(
			makeBtn("prev", currentPage - 1, currentPage <= 1),
			makeInfo(currentPage, pages),
			makeBtn("next", currentPage + 1, currentPage >= pages),
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
		if (page < 1 || page > totalPages()) return;
		currentPage = page;
		renderPage();

		const grid = getGrid();
		if (grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
	}

	function applyFilter(trimmed) {
		if (!trimmed) {
			filtered = null;
		} else if (searchIndex) {
			filtered = [];
			for (let i = 0; i < searchIndex.length; i++) {
				if (searchIndex[i].includes(trimmed)) filtered.push(data[i]);
			}
		} else {
			filtered = data.filter((item) => matchItem(item, trimmed));
		}
		currentPage = 1;
		renderPage();
	}

	function filter(term) {
		pendingTerm = term.trim().toLowerCase();
		if (filterDebounceMs <= 0) {
			applyFilter(pendingTerm);
			return;
		}
		clearTimeout(filterTimer);
		filterTimer = setTimeout(() => applyFilter(pendingTerm), filterDebounceMs);
	}

	function attach(parent = document) {
		if (attached) return;
		attached = true;
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
			searchIndex = searchableText
				? data.map((item) => searchableText(item).toLowerCase())
				: null;
			filtered = null;
			currentPage = 1;
			renderPage();
		},
		render: renderPage,
		filter,
		attach,
	};
}
