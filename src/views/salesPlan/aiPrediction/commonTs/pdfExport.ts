import { marked } from 'marked';
import html2pdf from 'html2pdf.js';

const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;
const PAGE_PADDING_X = 56;
const PAGE_PADDING_Y = 48;
const PAGE_CONTENT_HEIGHT = PAGE_HEIGHT - PAGE_PADDING_Y * 2;
const OVERFLOW_TOLERANCE = 2;
const PDF_PAGE_WIDTH = 210;
const PDF_PAGE_HEIGHT = 297;
const PDF_CANVAS_WIDTH = PAGE_WIDTH * 2;
const PDF_CANVAS_HEIGHT = Math.floor((PDF_CANVAS_WIDTH * PDF_PAGE_HEIGHT) / PDF_PAGE_WIDTH);

const setStyles = (el: HTMLElement, styles: Record<string, string>) => {
    Object.entries(styles).forEach(([key, value]) => {
        el.style[key as any] = value;
    });
};

const createExportStyle = () => {
    const style = document.createElement('style');
    style.innerHTML = `
        .ai-report-pdf-root {
            width: ${PAGE_WIDTH}px;
            background: #ffffff;
        }

        .ai-report-pdf-page {
            width: ${PAGE_WIDTH}px;
            height: ${PAGE_HEIGHT}px;
            box-sizing: border-box;
            overflow: hidden;
            padding: ${PAGE_PADDING_Y}px ${PAGE_PADDING_X}px;
            background: #ffffff;
            color: var(--base-grey4, #333333);
            font-size: 16px;
            line-height: 1.75;
        }

        .ai-report-pdf-content {
            height: ${PAGE_CONTENT_HEIGHT}px;
            overflow: hidden;
        }

        .ai-report-pdf-content > :first-child {
            margin-top: 0 !important;
        }

        .ai-report-pdf-content h1,
        .ai-report-pdf-content h2,
        .ai-report-pdf-content h3,
        .ai-report-pdf-content h4 {
            margin: 16px 0 10px;
            color: var(--base-grey4, #333333);
            font-weight: 600;
            line-height: 1.35;
        }

        .ai-report-pdf-content h1 {
            font-size: 24px;
        }

        .ai-report-pdf-content h2 {
            font-size: 22px;
        }

        .ai-report-pdf-content h3 {
            font-size: 20px;
        }

        .ai-report-pdf-content h4 {
            font-size: 18px;
        }

        .ai-report-pdf-content p,
        .ai-report-pdf-content ul,
        .ai-report-pdf-content ol,
        .ai-report-pdf-content blockquote,
        .ai-report-pdf-content pre,
        .ai-report-pdf-content table {
            margin: 0 0 12px;
        }

        .ai-report-pdf-content ul,
        .ai-report-pdf-content ol {
            padding-left: 22px;
        }

        .ai-report-pdf-content code {
            padding: 2px 4px;
            border-radius: 3px;
            background: #f2f4f7;
            font-size: 14px;
            font-family: monospace;
        }

        .ai-report-pdf-content pre {
            overflow: hidden;
            white-space: pre-wrap;
            word-break: break-word;
            padding: 12px;
            border-radius: 4px;
            background: #f2f4f7;
            font-size: 14px;
        }

        .ai-report-pdf-content pre code {
            padding: 0;
            background: transparent;
        }

        .ai-report-pdf-content table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }

        .ai-report-pdf-content th,
        .ai-report-pdf-content td {
            padding: 8px 10px;
            border: 1px solid #e7eaf2;
            text-align: left;
            word-break: break-word;
        }

        .ai-report-pdf-content img {
            max-width: 100%;
            max-height: ${PAGE_CONTENT_HEIGHT}px;
            object-fit: contain;
        }
    `;
    return style;
};

const createPage = () => {
    const page = document.createElement('div');
    const content = document.createElement('div');
    page.className = 'ai-report-pdf-page';
    content.className = 'ai-report-pdf-content';
    page.appendChild(content);
    return {
        page,
        content,
    };
};

const createRoot = () => {
    const root = document.createElement('div');
    root.className = 'ai-report-pdf-root';
    setStyles(root, {
        position: 'absolute',
        left: '-10000px',
        top: '0',
        zIndex: '-1',
        pointerEvents: 'none',
    });
    root.appendChild(createExportStyle());
    document.body.appendChild(root);
    return root;
};

const getTextPieces = (text: string, isPre = false) => {
    if (isPre) {
        return text
            .split('\n')
            .flatMap((line, index, array) => {
                const chunks = line.match(/.{1,80}/g) || [''];
                if (index < array.length - 1) {
                    chunks[chunks.length - 1] = `${chunks[chunks.length - 1]}\n`;
                }
                return chunks;
            });
    }

    const normalizedText = text.trim();
    const sentencePieces = normalizedText.match(/[^。！？；.!?;]+[。！？；.!?;]?/g) || [normalizedText];
    return sentencePieces.flatMap((piece) => piece.match(/.{1,80}/g) || []);
};

const getTableRows = (table: HTMLTableElement) => {
    const bodyRows = Array.from(table.tBodies).flatMap((tbody) => Array.from(tbody.rows));
    if (bodyRows.length) return bodyRows;
    return Array.from(table.rows).filter((row) => row.parentElement?.tagName.toLowerCase() !== 'thead');
};

const createPaginatedRoot = (markdown: string) => {
    const source = document.createElement('div');
    source.innerHTML = marked.parse(markdown, {
        gfm: true,
        breaks: true,
    }) as string;

    const root = createRoot();
    let current = createPage();
    root.appendChild(current.page);

    const isOverflow = () => current.content.scrollHeight > current.content.clientHeight + OVERFLOW_TOLERANCE;
    const hasContent = () => current.content.children.length > 0 || Boolean(current.content.textContent?.trim());

    const nextPage = () => {
        current = createPage();
        root.appendChild(current.page);
    };

    const removeEmptyCurrentPage = () => {
        if (!hasContent()) {
            current.page.remove();
        }
    };

    const appendTextBlock = (sourceElement: HTMLElement) => {
        const pieces = getTextPieces(sourceElement.textContent || '', sourceElement.tagName.toLowerCase() === 'pre');
        let block = sourceElement.cloneNode(false) as HTMLElement;
        let currentText = '';

        const startBlock = () => {
            block = sourceElement.cloneNode(false) as HTMLElement;
            currentText = '';
            current.content.appendChild(block);
        };

        startBlock();

        pieces.forEach((piece) => {
            const previousText = currentText;
            currentText += piece;
            block.textContent = currentText;

            if (!isOverflow()) return;

            currentText = previousText;
            block.textContent = previousText;

            if (previousText.trim()) {
                nextPage();
                startBlock();
                currentText = piece;
                block.textContent = currentText;
                return;
            }

            block.remove();
            if (hasContent()) {
                nextPage();
            }
            startBlock();
            currentText = piece;
            block.textContent = currentText;
        });

        if (!block.textContent?.trim()) {
            block.remove();
        }
    };

    const splitContainerByChildren = (sourceElement: Element) => {
        const children = Array.from(sourceElement.children);
        if (!children.length) return false;

        let container = sourceElement.cloneNode(false) as HTMLElement;

        const startContainer = () => {
            container = sourceElement.cloneNode(false) as HTMLElement;
            current.content.appendChild(container);
        };

        const removeEmptyContainer = () => {
            if (!container.children.length) {
                container.remove();
            }
        };

        startContainer();

        children.forEach((child) => {
            const node = child.cloneNode(true) as HTMLElement;
            container.appendChild(node);

            if (!isOverflow()) return;

            container.removeChild(node);

            if (container.children.length) {
                nextPage();
                startContainer();
                container.appendChild(node);

                if (!isOverflow()) return;

                container.removeChild(node);
            }

            removeEmptyContainer();
            appendElement(child);
            startContainer();
        });

        removeEmptyContainer();
        return true;
    };

    const splitList = (sourceElement: HTMLElement) => {
        const items = Array.from(sourceElement.children);
        if (!items.length) return false;

        let list = sourceElement.cloneNode(false) as HTMLElement;

        const startList = () => {
            list = sourceElement.cloneNode(false) as HTMLElement;
            current.content.appendChild(list);
        };

        const removeEmptyList = () => {
            if (!list.children.length) {
                list.remove();
            }
        };

        startList();

        items.forEach((item) => {
            const node = item.cloneNode(true) as HTMLElement;
            list.appendChild(node);

            if (!isOverflow()) return;

            list.removeChild(node);

            if (list.children.length) {
                nextPage();
                startList();
                list.appendChild(node);

                if (!isOverflow()) return;

                list.removeChild(node);
            }

            removeEmptyList();
            appendElement(item);
            startList();
        });

        removeEmptyList();
        return true;
    };

    const splitTable = (sourceElement: HTMLTableElement) => {
        const rows = getTableRows(sourceElement);
        if (!rows.length) return false;

        let body = document.createElement('tbody');

        const createTable = () => {
            const table = sourceElement.cloneNode(false) as HTMLTableElement;
            const colgroup = sourceElement.querySelector('colgroup')?.cloneNode(true);
            const thead = sourceElement.tHead?.cloneNode(true);
            if (colgroup) table.appendChild(colgroup);
            if (thead) table.appendChild(thead);

            body = document.createElement('tbody');
            table.appendChild(body);
            return table;
        };

        const startTable = () => {
            const table = createTable();
            current.content.appendChild(table);
            return table;
        };

        const appendSingleRowTable = (row: HTMLTableRowElement) => {
            const table = createTable();
            body.appendChild(row.cloneNode(true));
            current.content.appendChild(table);
        };

        let table = startTable();
        let shouldStartNewTable = false;

        rows.forEach((row) => {
            if (shouldStartNewTable) {
                nextPage();
                table = startTable();
                shouldStartNewTable = false;
            }

            const node = row.cloneNode(true) as HTMLTableRowElement;
            body.appendChild(node);

            if (!isOverflow()) return;

            body.removeChild(node);

            if (body.children.length) {
                nextPage();
                table = startTable();
                body.appendChild(node);

                if (!isOverflow()) return;

                body.removeChild(node);
            }

            if (!body.children.length) {
                table.remove();
            }

            appendSingleRowTable(row);
            shouldStartNewTable = true;
        });

        if (!body.children.length) {
            table.remove();
        }

        return true;
    };

    function splitElement(sourceElement: Element): boolean {
        const tagName = sourceElement.tagName.toLowerCase();

        if (tagName === 'table') {
            return splitTable(sourceElement as HTMLTableElement);
        }

        if (tagName === 'ul' || tagName === 'ol') {
            return splitList(sourceElement as HTMLElement);
        }

        if (['p', 'pre', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4'].includes(tagName)) {
            appendTextBlock(sourceElement as HTMLElement);
            return true;
        }

        return splitContainerByChildren(sourceElement);
    }

    function appendElement(sourceElement: Element) {
        const node = sourceElement.cloneNode(true) as HTMLElement;
        current.content.appendChild(node);

        if (!isOverflow()) return;

        current.content.removeChild(node);

        if (splitElement(sourceElement)) return;

        if (hasContent()) {
            nextPage();
            current.content.appendChild(node);

            if (!isOverflow()) return;

            current.content.removeChild(node);
        }

        current.content.appendChild(node);
    }

    Array.from(source.children).forEach((child) => appendElement(child));

    if (!source.children.length && source.textContent) {
        current.content.textContent = source.textContent;
    }

    removeEmptyCurrentPage();

    if (!root.querySelector('.ai-report-pdf-page')) {
        root.appendChild(createPage().page);
    }

    return root;
};

const getPdfOptions = (filename: string) => ({
    margin: 0,
    filename,
    image: {
        type: 'jpeg',
        quality: 1,
    },
    html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
        windowWidth: PAGE_WIDTH,
        windowHeight: PAGE_HEIGHT,
    },
    jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
    },
});

const waitForFonts = async () => {
    if ('fonts' in document) {
        await (document as any).fonts.ready;
    }
};

const createHtml2PdfHiddenStyle = () => {
    const style = document.createElement('style');
    style.textContent = `
        .html2pdf__overlay {
            opacity: 0 !important;
            background: transparent !important;
            pointer-events: none !important;
        }
    `;
    document.head.appendChild(style);
    return style;
};

const renderPageCanvas = async (page: HTMLElement, filename: string) => {
    const sourceCanvas = await html2pdf()
        .set(getPdfOptions(filename) as any)
        .from(page)
        .toCanvas()
        .get('canvas');

    const canvas = document.createElement('canvas');
    canvas.width = PDF_CANVAS_WIDTH;
    canvas.height = PDF_CANVAS_HEIGHT;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('PDF画布创建失败');
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, 0, 0, canvas.width, canvas.height);
    return canvas;
};

export const exportMarkdownToPdf = async (markdown: string, filename: string) => {
    const root = createPaginatedRoot(markdown);
    const pages = Array.from(root.querySelectorAll('.ai-report-pdf-page')) as HTMLElement[];
    const hiddenStyle = createHtml2PdfHiddenStyle();

    try {
        await waitForFonts();

        const firstWorker = html2pdf()
            .set(getPdfOptions(filename) as any)
            .from(await renderPageCanvas(pages[0], filename))
            .toPdf();
        const pdf = await firstWorker.get('pdf');

        for (let index = 1; index < pages.length; index += 1) {
            const canvas = await renderPageCanvas(pages[index], filename);
            pdf.addPage('a4', 'portrait');
            pdf.addImage(canvas.toDataURL('image/jpeg', 1), 'JPEG', 0, 0, PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT);
        }

        pdf.save(filename);
    } finally {
        hiddenStyle.remove();
        root.remove();
    }
};
