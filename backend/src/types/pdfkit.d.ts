declare module "pdfkit" {
	interface PDFDocumentOptions {
		margin?: number;
		margins?: { top?: number; bottom?: number; left?: number; right?: number };
		size?: string;
		bufferPages?: boolean;
	}

	interface PDFDocument {
		on(event: "data", handler: (chunk: Buffer) => void): this;
		on(event: "end", handler: () => void): this;
		on(event: "error", handler: (err: Error) => void): this;
		end(): void;
		addPage(): this;
		switchToPage(n: number): this;
		bufferedPageRange(): { start: number; count: number };
		font(name: string): this;
		fontSize(size: number): this;
		fillColor(color: string): this;
		strokeColor(color: string): this;
		lineWidth(w: number): this;
		text(text: string, x?: number, y?: number, opts?: object): this;
		text(text: string, opts?: object): this;
		moveDown(lines?: number): this;
		moveTo(x: number, y: number): this;
		lineTo(x: number, y: number): this;
		stroke(): this;
		rect(x: number, y: number, w: number, h: number): this;
		roundedRect(x: number, y: number, w: number, h: number, r: number): this;
		fill(color: string): this;
		circle(x: number, y: number, r: number): this;
		image(src: string | Buffer, x?: number, y?: number, opts?: object): this;
		heightOfString(text: string, opts?: object): number;
		y: number;
		page: { height: number; margins: { top: number; bottom: number; left: number; right: number } };
	}

	interface PDFDocumentConstructor {
		new (options?: PDFDocumentOptions): PDFDocument;
	}

	const PDFDocument: PDFDocumentConstructor;
	export default PDFDocument;
}
