import React, { useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale'; // Thêm import locale
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

const RevenueReport = ({ data, loading, dateRange }) => {
  const chartRef = useRef(null);

  // Format tiền tệ
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  // Tính tổng doanh thu
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const avgRevenuePerDay = Math.round(totalRevenue / (data.length || 1));

  // Hàm helper để format ngày an toàn
  const formatDateSafe = (date, formatStr, options = {}) => {
    try {
      return format(new Date(date), formatStr, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  // Hàm xuất PDF với tiếng Việt không dấu
  const exportToPDF = async () => {
    const doc = new jsPDF();

    // Sử dụng font an toàn
    const fonts = {
      normal: 'helvetica',
      bold: 'helvetica'
    };

    // Màu sắc chuyên nghiệp
    const colors = {
      primary: [0, 102, 204],        // Blue
      secondary: [52, 73, 94],       // Dark blue-gray
      accent: [46, 204, 113],        // Green
      text: [44, 62, 80],           // Dark gray
      lightGray: [236, 240, 241],   // Light gray
      darkGray: [149, 165, 166],    // Medium gray
      white: [255, 255, 255]
    };

    // === TRANG 1: TRANG BIA ===

    // Header
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, 210, 60, 'F');

    // Logo placeholder
    doc.setFillColor(...colors.white);
    doc.circle(30, 30, 15, 'F');
    doc.setFontSize(12);
    doc.setFont(fonts.normal);
    doc.setTextColor(...colors.primary);
    doc.text('LOGO', 30, 32, { align: 'center' });

    // Tieu de chinh
    doc.setFontSize(28);
    doc.setFont(fonts.bold, 'bold');
    doc.setTextColor(...colors.white);
    doc.text('BAO CAO DOANH THU', 105, 25, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont(fonts.normal);
    doc.text('PHONG KHAM DA KHOA ABC', 105, 35, { align: 'center' });

    // Dia chi va thong tin lien he
    doc.setFontSize(10);
    doc.setFont(fonts.normal);
    doc.text('123 Duong ABC, Quan XYZ, TP. Ho Chi Minh', 105, 42, { align: 'center' });
    doc.text('Dien thoai: (028) 1234 5678 | Email: info@phongkham.com', 105, 48, { align: 'center' });

    // Thong tin bao cao
    doc.setFillColor(...colors.lightGray);
    doc.roundedRect(20, 80, 170, 40, 5, 5, 'F');

    doc.setTextColor(...colors.text);
    doc.setFontSize(16);
    doc.setFont(fonts.bold, 'bold');
    doc.text('THONG TIN BAO CAO', 105, 95, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont(fonts.normal);
    doc.text(`Khoang thoi gian: ${dateRange.startDate} den ${dateRange.endDate}`, 25, 107);
    doc.text(`Ngay xuat bao cao: ${formatDateSafe(new Date(), 'dd/MM/yyyy HH:mm')}`, 25, 115);

    // Tom tat dieu hanh
    doc.setFillColor(...colors.accent);
    doc.roundedRect(20, 140, 170, 60, 5, 5, 'F');

    doc.setTextColor(...colors.white);
    doc.setFontSize(14);
    doc.setFont(fonts.bold, 'bold');
    doc.text('TOM TAT DIEU HANH', 105, 155, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont(fonts.normal);
    const formatForPDF = (value) => {
      return new Intl.NumberFormat('vi-VN').format(value) + ' VND';
    };

    const safeData = Array.isArray(data) ? data : [];
    const safeTotalRevenue = safeData.reduce((sum, item) => sum + (item.revenue || 0), 0);
    const safeAvgRevenuePerDay = Math.round(safeTotalRevenue / (safeData.length || 1));

    doc.text(`• Tong doanh thu: ${formatForPDF(safeTotalRevenue)}`, 25, 170);
    doc.text(`• Doanh thu trung binh/ngay: ${formatForPDF(safeAvgRevenuePerDay)}`, 25, 178);
    doc.text(`• So ngay co doanh thu: ${safeData.length} ngay`, 25, 186);

    if (safeData.length > 0) {
      const maxRevenue = Math.max(...safeData.map(item => item.revenue || 0));
      doc.text(`• Doanh thu cao nhat: ${formatForPDF(maxRevenue)}`, 25, 194);
    }

    // Footer trang bia
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(2);
    doc.line(20, 250, 190, 250);

    doc.setTextColor(...colors.darkGray);
    doc.setFontSize(8);
    doc.setFont(fonts.normal);
    doc.text('Bao cao duoc tao tu dong boi He thong Quan ly Phong kham', 105, 260, { align: 'center' });
    doc.text(`Trang 1`, 105, 270, { align: 'center' });

    // === TRANG 2: BIEU DO ===
    doc.addPage();

    // Header trang 2
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, 210, 30, 'F');

    doc.setTextColor(...colors.white);
    doc.setFontSize(18);
    doc.setFont(fonts.bold, 'bold');
    doc.text('BIEU DO PHAN TICH DOANH THU', 105, 20, { align: 'center' });

    // Thong ke nhanh
    const statsY = 45;
    const statBoxes = [
      {
        title: 'Tong doanh thu',
        value: formatForPDF(safeTotalRevenue),
        color: colors.primary
      },
      {
        title: 'TB/ngay',
        value: formatForPDF(safeAvgRevenuePerDay),
        color: colors.accent
      },
      {
        title: 'So ngay',
        value: `${safeData.length} ngay`,
        color: colors.secondary
      }
    ];

    statBoxes.forEach((stat, index) => {
      const x = 20 + (index * 57);

      // Box shadow effect
      doc.setFillColor(200, 200, 200);
      doc.roundedRect(x + 1, statsY + 1, 55, 25, 3, 3, 'F');

      // Main box
      doc.setFillColor(...colors.white);
      doc.roundedRect(x, statsY, 55, 25, 3, 3, 'F');
      doc.setDrawColor(...stat.color);
      doc.setLineWidth(1);
      doc.roundedRect(x, statsY, 55, 25, 3, 3, 'S');

      // Content
      doc.setTextColor(...stat.color);
      doc.setFontSize(8);
      doc.setFont(fonts.bold, 'bold');
      doc.text(stat.title, x + 27.5, statsY + 8, { align: 'center' });

      doc.setFontSize(9);
      doc.setFont(fonts.normal);
      doc.text(stat.value, x + 27.5, statsY + 18, { align: 'center' });
    });

    // Capture va them bieu do - SỬA LỖI KÍCH THƯỚC
    if (chartRef.current && safeData.length > 0) {
      try {
        // Tạo container mới với kích thước lớn hơn
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '0px';
        tempDiv.style.width = '1200px';        // Tăng kích thước
        tempDiv.style.height = '600px';        // Tăng kích thước
        tempDiv.style.backgroundColor = '#ffffff';
        tempDiv.style.padding = '40px';
        tempDiv.style.border = '2px solid #ddd';
        tempDiv.style.borderRadius = '8px';
        tempDiv.style.fontFamily = 'Arial, sans-serif';
        document.body.appendChild(tempDiv);

        // Tạo HTML mới cho biểu đồ thay vì clone
        tempDiv.innerHTML = `
          <div style="width: 100%; height: 100%; padding: 20px;">
            <div id="chart-container" style="width: 100%; height: 520px;"></div>
          </div>
        `;

        // Import React và Recharts động để render biểu đồ mới
        const React = window.React || require('react');
        const ReactDOM = window.ReactDOM || require('react-dom');
        const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = require('recharts');

        // Render biểu đồ mới với kích thước lớn
        const chartElement = React.createElement(
          ResponsiveContainer,
          { width: '100%', height: '100%' },
          React.createElement(
            LineChart,
            {
              data: safeData,
              margin: { top: 20, right: 40, left: 40, bottom: 20 }
            },
            React.createElement(CartesianGrid, { strokeDasharray: '3 3', stroke: '#ddd' }),
            React.createElement(XAxis, {
              dataKey: 'date',
              stroke: '#666',
              fontSize: 12,
              tickFormatter: (date) => formatDateSafe(date, 'dd/MM')
            }),
            React.createElement(YAxis, {
              stroke: '#666',
              fontSize: 12,
              tickFormatter: (value) => new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(value)
            }),
            React.createElement(Tooltip, {
              contentStyle: {
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              },
              formatter: (value) => [formatForPDF(value), 'Doanh thu'],
              labelFormatter: (date) => formatDateSafe(date, 'dd/MM/yyyy')
            }),
            React.createElement(Legend, { fontSize: 14 }),
            React.createElement(Line, {
              type: 'monotone',
              dataKey: 'revenue',
              name: 'Doanh thu',
              stroke: '#2563eb',
              strokeWidth: 3,
              dot: { fill: '#2563eb', strokeWidth: 2, r: 4 },
              activeDot: { r: 6, fill: '#1d4ed8' }
            })
          )
        );

        // Render vào container
        const chartContainer = tempDiv.querySelector('#chart-container');
        ReactDOM.render(chartElement, chartContainer);

        // Đợi render hoàn tất
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Capture với kích thước mới
        const canvas = await html2canvas(tempDiv, {
          backgroundColor: '#ffffff',
          scale: 2,                          // Scale cao để sắc nét
          useCORS: true,
          allowTaint: false,
          logging: false,
          width: 1200,                       // Cố định width
          height: 600,                       // Cố định height
          onclone: (clonedDoc) => {
            // Đảm bảo fonts được load
            const clonedDiv = clonedDoc.querySelector('div');
            if (clonedDiv) {
              clonedDiv.style.fontFamily = 'Arial, sans-serif';
            }
          }
        });

        // Cleanup
        document.body.removeChild(tempDiv);

        // Thêm vào PDF với kích thước lớn hơn
        doc.setDrawColor(...colors.primary);
        doc.setLineWidth(1);
        doc.roundedRect(10, 75, 190, 140, 8, 8, 'S');  // Khung lớn hơn

        const imgData = canvas.toDataURL('image/png', 1.0);  // Chất lượng cao nhất
        const imgWidth = 180;                // Tăng kích thước ảnh
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Thêm ảnh với kích thước lớn
        doc.addImage(imgData, 'PNG', 15, 80, imgWidth, Math.min(imgHeight, 130));

      } catch (error) {
        console.error('Loi khi capture bieu do:', error);

        // Fallback đơn giản hơn - sử dụng canvas trực tiếp
        try {
          const originalChart = chartRef.current;
          const canvas = await html2canvas(originalChart, {
            backgroundColor: '#ffffff',
            scale: 3,
            useCORS: true,
            allowTaint: false,
            logging: false
          });

          doc.setDrawColor(...colors.primary);
          doc.setLineWidth(1);
          doc.roundedRect(10, 75, 190, 140, 8, 8, 'S');

          const imgData = canvas.toDataURL('image/png', 1.0);
          const imgWidth = 180;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          doc.addImage(imgData, 'PNG', 15, 80, imgWidth, Math.min(imgHeight, 130));

        } catch (fallbackError) {
          console.error('Fallback capture failed:', fallbackError);

          // Thông báo lỗi
          doc.setFillColor(...colors.lightGray);
          doc.roundedRect(15, 80, 180, 130, 8, 8, 'F');

          doc.setTextColor(...colors.text);
          doc.setFontSize(16);
          doc.setFont(fonts.normal);
          doc.text('Khong the tai bieu do', 105, 145, { align: 'center' });
        }
      }
    }

    // Ghi chu bieu do
    doc.setTextColor(...colors.darkGray);
    doc.setFontSize(9);
    doc.setFont(fonts.normal);
    doc.text('* Bieu do the hien xu huong doanh thu theo thoi gian', 20, 210);
    doc.text('* Don vi tinh: VND (Viet Nam Dong)', 20, 218);

    // === TRANG 3: BANG CHI TIET ===
    doc.addPage();

    // Header trang 3
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, 210, 30, 'F');

    doc.setTextColor(...colors.white);
    doc.setFontSize(18);
    doc.setFont(fonts.bold, 'bold');
    doc.text('CHI TIET DOANH THU THEO NGAY', 105, 20, { align: 'center' });

    // Chuan bi du lieu bang voi error handling
    const tableData = safeData.map((item, index) => [
      index + 1,
      formatDateSafe(item.date, 'dd/MM/yyyy'),
      getDayOfWeek(item.date),
      formatForPDF(item.revenue || 0)
    ]);

    // Tính toán để căn giữa bảng hoàn toàn
    const pageWidth = 210; // A4 width in mm
    const totalTableWidth = 140; // Tổng width của bảng (20+35+35+50 = 140)
    const leftMargin = (pageWidth - totalTableWidth) / 2; // Căn giữa chính xác

    // Tao bang voi font an toan va can giua hoan toan
    autoTable(doc, {
      startY: 45,
      margin: { 
        top: 45, 
        bottom: 25, 
        left: leftMargin,   // Căn giữa tự động
        right: leftMargin   // Căn giữa tự động
      },
      head: [['STT', 'Ngày', 'Thứ', 'Doanh thu (VND)']],
      body: tableData,
      theme: 'grid',
      tableWidth: totalTableWidth, // Width cố định thay vì 'wrap'
      styles: {
        font: 'helvetica',
        fontSize: 9,         // Tăng lại fontSize
        cellPadding: 4,      // Tăng lại cellPadding
        textColor: colors.text,
        lineColor: colors.darkGray,
        lineWidth: 0.1,
        halign: 'center',    // Căn giữa cho tất cả cell
        valign: 'middle'     // Căn giữa theo chiều dọc
      },
      headStyles: {
        font: 'helvetica',
        fillColor: colors.primary,
        textColor: colors.white,
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center',    // Căn giữa header
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20 },  // STT
        1: { halign: 'center', cellWidth: 35 },  // Ngày
        2: { halign: 'center', cellWidth: 35 },  // Thứ
        3: { halign: 'right',  cellWidth: 50 }   // Doanh thu
      }
    });


    // Them hang tong cong
    const finalY = doc.lastAutoTable.finalY + 5;

    // Box tổng cộng căn đều với bảng
    doc.setFillColor(200, 200, 200);
    doc.roundedRect(leftMargin + 1, finalY + 1, totalTableWidth - 2, 12, 2, 2, 'F');

    doc.setFillColor(...colors.accent);
    doc.roundedRect(leftMargin, finalY, totalTableWidth, 12, 2, 2, 'F');

    doc.setTextColor(...colors.white);
    doc.setFontSize(11);
    doc.setFont(fonts.bold, 'bold');
    doc.text('TONG CONG:', leftMargin + 10, finalY + 8);
    doc.text(formatForPDF(safeTotalRevenue), leftMargin + totalTableWidth - 10, finalY + 8, { align: 'right' });

    // Box phân tích căn đều với bảng
    const analysisY = finalY + 25;
    doc.setFillColor(...colors.lightGray);
    doc.roundedRect(leftMargin, analysisY, totalTableWidth, 35, 5, 5, 'F');

    doc.setTextColor(...colors.text);
    doc.setFontSize(10);
    doc.setFont(fonts.bold, 'bold');
    doc.text('PHAN TICH NHANH:', leftMargin + 5, analysisY + 10);

    doc.setFont(fonts.normal);
    doc.setFontSize(9);

    // Tinh toan them cac chi so (voi error handling)
    if (safeData.length > 0) {
      const revenues = safeData.map(item => item.revenue || 0);
      const minRevenue = Math.min(...revenues);
      const maxRevenue = Math.max(...revenues);
      const sortedRevenues = [...revenues].sort((a, b) => a - b);
      const medianRevenue = sortedRevenues[Math.floor(sortedRevenues.length / 2)] || 0;

      doc.text(`• Doanh thu thap nhat: ${formatForPDF(minRevenue)}`, leftMargin + 5, analysisY + 18);
      doc.text(`• Doanh thu cao nhat: ${formatForPDF(maxRevenue)}`, leftMargin + 5, analysisY + 26);
      doc.text(`• Doanh thu trung vi: ${formatForPDF(medianRevenue)}`, leftMargin + 5, analysisY + 34);
    } else {
      doc.text('• Khong co du lieu de phan tich', leftMargin + 5, analysisY + 18);
    }

    // === FOOTER CHO TAT CA TRANG ===
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.height;

      // Duong ke footer
      doc.setDrawColor(...colors.primary);
      doc.setLineWidth(0.5);
      doc.line(20, pageHeight - 25, 190, pageHeight - 25);

      // Thong tin footer
      doc.setFontSize(8);
      doc.setFont(fonts.normal);
      doc.setTextColor(...colors.darkGray);

      if (i === 1) {
        doc.text('Bao cao duoc tao tu dong boi He thong Quan ly Phong kham ABC', 105, pageHeight - 15, { align: 'center' });
      } else {
        doc.text('PHONG KHAM DA KHOA ABC', 20, pageHeight - 15);
        doc.text(`Ngay xuat: ${formatDateSafe(new Date(), 'dd/MM/yyyy')}`, 105, pageHeight - 15, { align: 'center' });
      }

      doc.text(`Trang ${i} / ${pageCount}`, 190, pageHeight - 15, { align: 'right' });
    }

    // Luu file
    const timestamp = formatDateSafe(new Date(), 'yyyyMMdd_HHmmss');
    const fileName = `BaoCao_DoanhThu_${dateRange.startDate.replace(/\//g, '')}_${dateRange.endDate.replace(/\//g, '')}_${timestamp}.pdf`;
    doc.save(fileName);
  };

  // Handle case when data is empty or has error
  const safeData = Array.isArray(data) ? data : [];
  const safeTotalRevenue = safeData.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const safeAvgRevenuePerDay = Math.round(safeTotalRevenue / (safeData.length || 1));
  const maxRevenue = safeData.length > 0 ? Math.max(...safeData.map(item => item.revenue || 0)) : 0;

  // Cập nhật hàm getDayOfWeek để trả về tiếng Việt không dấu
  const getDayOfWeek = (date) => {
    try {
      const dayIndex = new Date(date).getDay();
      const days = ['Chu Nhat', 'Thu Hai', 'Thu Ba', 'Thu Tu', 'Thu Nam', 'Thu Sau', 'Thu Bay'];
      return days[dayIndex] || 'N/A';
    } catch (error) {
      console.error('Error getting day of week:', error);
      return 'N/A';
    }
  };

  return (
    <>
      {/* Export Button */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={exportToPDF}
          disabled={loading || safeData.length === 0}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center transition-colors"
        >
          <i className="fas fa-file-pdf mr-2"></i>
          Xuất PDF (có biểu đồ)
        </button>
      </div>

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Tổng doanh thu */}
        <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-dark-textSecondary text-sm">Tổng doanh thu</p>
              <h3 className="text-2xl font-bold text-primary-300 mt-1">{formatCurrency(safeTotalRevenue)}</h3>
            </div>
            <div className="p-3 rounded-full bg-primary-900 bg-opacity-20">
              <i className="fas fa-coins text-primary-300"></i>
            </div>
          </div>
          <p className="text-xs text-dark-textSecondary mt-2">
            Khoảng thời gian: {dateRange?.startDate} đến {dateRange?.endDate}
          </p>
        </div>

        {/* Doanh thu trung bình mỗi ngày */}
        <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-dark-textSecondary text-sm">Doanh thu trung bình / ngày</p>
              <h3 className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(safeAvgRevenuePerDay)}</h3>
            </div>
            <div className="p-3 rounded-full bg-green-900 bg-opacity-20">
              <i className="fas fa-chart-line text-green-400"></i>
            </div>
          </div>
        </div>

        {/* Số ngày có doanh thu */}
        <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-dark-textSecondary text-sm">Số ngày có doanh thu</p>
              <h3 className="text-2xl font-bold text-blue-400 mt-1">{safeData.length}</h3>
            </div>
            <div className="p-3 rounded-full bg-blue-900 bg-opacity-20">
              <i className="fas fa-calendar-check text-blue-400"></i>
            </div>
          </div>
        </div>

        {/* Doanh thu cao nhất */}
        <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-dark-textSecondary text-sm">Doanh thu cao nhất</p>
              <h3 className="text-2xl font-bold text-orange-400 mt-1">
                {formatCurrency(maxRevenue)}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-orange-900 bg-opacity-20">
              <i className="fas fa-arrow-up text-orange-400"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Biểu đồ */}
      <div className="bg-dark-card rounded-lg shadow mb-6 border border-dark-border">
        <div className="p-4 border-b border-dark-border flex justify-between items-center">
          <h2 className="text-lg font-medium text-dark-text">Biểu đồ doanh thu</h2>
          <div className="flex space-x-2">
            <button
              onClick={exportToPDF}
              disabled={loading || safeData.length === 0}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm flex items-center transition-colors"
            >
              <i className="fas fa-download mr-1"></i>
              PDF
            </button>
          </div>
        </div>
        <div className="p-4 overflow-hidden" ref={chartRef}>
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-3"></div>
              <p className="text-dark-textSecondary">Đang tải dữ liệu báo cáo...</p>
            </div>
          ) : safeData.length === 0 ? (
            <div className="p-12 text-center">
              <i className="fas fa-chart-line text-4xl text-dark-textSecondary mb-4"></i>
              <p className="text-dark-textSecondary">Không có dữ liệu để hiển thị biểu đồ</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={safeData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis
                  dataKey="date"
                  stroke="#aaa"
                  tickFormatter={(date) => formatDateSafe(date, 'dd/MM')}
                />
                <YAxis stroke="#aaa" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#333', border: '1px solid #555' }}
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(date) => formatDateSafe(date, 'dd/MM/yyyy')}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#82ca9d" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="bg-dark-card rounded-lg shadow border border-dark-border">
        <div className="p-4 border-b border-dark-border">
          <h2 className="text-lg font-medium text-dark-text">Doanh thu theo ngày</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-border">
            <thead className="bg-secondary-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                  STT
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                  Ngày
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                  Doanh thu
                </th>
              </tr>
            </thead>
            <tbody className="bg-dark-card divide-y divide-dark-border">
              {safeData.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-dark-textSecondary">
                    <i className="fas fa-table text-4xl mb-4 opacity-50"></i>
                    <p>Không có dữ liệu doanh thu</p>
                  </td>
                </tr>
              ) : (
                safeData.map((item, index) => (
                  <tr key={index} className="hover:bg-secondary-900">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text">
                      {formatDateSafe(item.date, 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                      {formatCurrency(item.revenue || 0)}
                    </td>
                  </tr>
                ))
              )}
              {safeData.length > 0 && (
                <tr className="bg-secondary-800 font-bold">
                  <td colSpan="2" className="px-6 py-4 text-sm text-dark-text">
                    TỔNG CỘNG
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-300">
                    {formatCurrency(safeTotalRevenue)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default RevenueReport;