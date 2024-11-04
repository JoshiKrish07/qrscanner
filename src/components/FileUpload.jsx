import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';

function FileUpload() {
  const [data, setData] = useState(null);
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const tableRef = useRef(); // Create a ref for the table

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const workbook = XLSX.read(event.target.result, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(sheet);
      setData(sheetData);
    };

    reader.readAsArrayBuffer(file);
  };

  const generatePDFWithQRCode = async () => {
    const pdf = new jsPDF();
    const margin = 20; // Margin for the PDF

    // Capture the table using html2canvas
    const canvas = await html2canvas(tableRef.current);
    const imgData = canvas.toDataURL('image/png');

    // Add QR code placeholder first (we'll replace it with the actual QR code later)
    pdf.addImage(imgData, 'PNG', margin, margin + 60, 180, 0); // Position for the table

    // Generate the PDF before creating the QR code
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob); // Create a blob URL for the PDF

    // Generate QR code with the PDF Blob URL
    try {
      const qrCodeCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCodeCanvas, pdfUrl, { errorCorrectionLevel: 'H' });
      const qrCodeImageData = qrCodeCanvas.toDataURL('image/png');
      setQrCodeImage(qrCodeImageData); // Save the QR code image

      // Clear the PDF and recreate it with QR code at the top
      const finalPDF = new jsPDF();
      finalPDF.addImage(qrCodeImageData, 'PNG', margin, margin, 50, 50); // Add QR code to the top
      finalPDF.addImage(imgData, 'PNG', margin, margin + 60, 180, 0); // Add table image below QR code
      finalPDF.save('imported_data_with_qrcode.pdf'); // Save the final PDF
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileUpload} />
      {data && (
        <div>
          <h2>Imported Data:</h2>
          <button onClick={generatePDFWithQRCode}>Generate PDF with QR Code</button>
          {qrCodeImage && (
            <div>
              <h3>Generated QR Code:</h3>
              <img src={qrCodeImage} alt="QR Code" />
            </div>
          )}
          <table ref={tableRef} border="1" cellPadding="10">
            <thead>
              <tr>
                {Object.keys(data[0]).map((key) => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((value, i) => (
                    <td key={i}>{value === '-' ? 'N/A' : value}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
