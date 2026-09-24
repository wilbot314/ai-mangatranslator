import JSZip from 'jszip';
import { ComicPageItem, ComicFontFamily } from '../types/comic';
import { renderComicPage, RenderOptions } from './typesetter';

export interface BatchZipExportOptions {
  pages: ComicPageItem[];
  sourceLang: string;
  targetLang: string;
  globalFontFamily: ComicFontFamily;
  globalUppercase: boolean;
  includeScript?: boolean;
  zipName?: string;
  onProgress?: (current: number, total: number, message: string) => void;
}

/**
 * Renders all pages into high-res PNG blobs and bundles them into a downloadable ZIP archive.
 */
export async function downloadPagesAsZip(options: BatchZipExportOptions): Promise<void> {
  const {
    pages,
    sourceLang,
    targetLang,
    globalFontFamily,
    globalUppercase,
    includeScript = true,
    zipName = `translated_comics_${Date.now()}.zip`,
    onProgress,
  } = options;

  const zip = new JSZip();
  const pagesFolder = zip.folder('translated_pages') || zip;
  let combinedScript = `# ManhwaScan Translation Script Export\n`;
  combinedScript += `Exported: ${new Date().toLocaleString()}\n`;
  combinedScript += `Languages: ${sourceLang} -> ${targetLang}\n`;
  combinedScript += `Total Pages: ${pages.length}\n\n`;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const pageNumStr = String(i + 1).padStart(3, '0');
    const safeName = page.name ? page.name.replace(/\.[^/.]+$/, '') : `page_${pageNumStr}`;

    if (onProgress) {
      onProgress(i + 1, pages.length, `Rendering Page ${i + 1} of ${pages.length}...`);
    }

    // Load image element
    const img = await loadImage(page.originalDataUrl);

    // Create offscreen canvas
    const canvas = document.createElement('canvas');
    const renderOpts: RenderOptions = {
      showOriginal: false,
      showBoundingBoxes: false,
      globalFontFamily,
      globalUppercase,
      customPatches: page.customPatches || [],
    };

    renderComicPage(canvas, img, page.blocks, renderOpts);

    // Convert to blob
    const blob = await canvasToBlob(canvas);
    pagesFolder.file(`${pageNumStr}_${safeName}_translated.png`, blob);

    // Append to script
    combinedScript += `=======================================================\n`;
    combinedScript += `PAGE ${i + 1}: ${page.name}\n`;
    if (page.pageSummary) {
      combinedScript += `Summary: ${page.pageSummary}\n`;
    }
    combinedScript += `=======================================================\n`;

    const sortedBlocks = [...page.blocks].sort((a, b) => a.reading_order - b.reading_order);
    if (sortedBlocks.length === 0) {
      combinedScript += `(No dialogue blocks detected on this page)\n\n`;
    } else {
      sortedBlocks.forEach((block) => {
        combinedScript += `[#${block.reading_order || block.id}] (${block.bubble_type.toUpperCase()})\n`;
        combinedScript += `  ${sourceLang}: ${block.original_text || '(SFX/No OCR)'}\n`;
        combinedScript += `  ${targetLang}: ${block.translated_text}\n\n`;
      });
    }
  }

  if (includeScript) {
    zip.file('translation_script.txt', combinedScript);
  }

  if (onProgress) {
    onProgress(pages.length, pages.length, 'Compacting ZIP archive...');
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = zipName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob || new Blob([]));
    }, 'image/png');
  });
}
