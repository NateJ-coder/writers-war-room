export const exportToPDF = async (content: string, title: string): Promise<void> => {
  // Create a new window for printing
  const printWindow = window.open('', '', 'width=800,height=600');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        @page { margin: 1in; }
        body {
          font-family: 'Times New Roman', serif;
          font-size: 12pt;
          line-height: 2;
          color: #000;
          background: #fff;
          max-width: 6.5in;
          margin: 0 auto;
        }
        h1 {
          text-align: center;
          font-size: 24pt;
          margin-bottom: 2em;
        }
        h2 {
          page-break-before: always;
          font-size: 18pt;
          margin-top: 2em;
        }
        p {
          text-indent: 0.5in;
          margin: 0;
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      ${content.split('\n\n').map(para => `<p>${para}</p>`).join('\n')}
    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

export const exportToWord = (content: string, title: string): void => {
  const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${title}</title></head><body>`;
  const footer = "</body></html>";
  
  const sourceHTML = header + content.split('\n\n').map(para => `<p>${para}</p>`).join('\n') + footer;
  
  const blob = new Blob(['\ufeff', sourceHTML], {
    type: 'application/msword'
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title}.doc`;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportToText = (content: string, title: string): void => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title}.txt`;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportToMarkdown = (content: string, title: string): void => {
  const markdown = `# ${title}\n\n${content}`;
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title}.md`;
  link.click();
  URL.revokeObjectURL(url);
};
