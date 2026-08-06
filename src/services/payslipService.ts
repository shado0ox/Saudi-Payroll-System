import { Payslip, SystemConfig } from '../types';
import { formatCurrency } from '../utils/currency';
import { formatPeriodLabel } from '../utils/dateHelper';

export class PayslipService {
  /**
   * Service 2: Digital Payslip Presentation and HTML Document Builder
   */
  static generatePrintableHtml(payslip: Payslip, config: SystemConfig): string {
    const periodName = formatPeriodLabel(payslip.period);
    const earnings = payslip.items.filter(i => i.category === 'earnings');
    const deductions = payslip.items.filter(i => i.category === 'deductions');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Payslip - ${payslip.employeeName} (${periodName})</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; padding: 40px; background: #fff; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0284c7; padding-bottom: 20px; }
          .company { font-size: 20px; font-weight: bold; color: #0f172a; }
          .title { font-size: 24px; font-weight: bold; color: #0284c7; text-align: right; }
          .meta { margin-top: 25px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8fafc; padding: 15px; border-radius: 8px; }
          .meta-item { font-size: 14px; }
          .meta-item strong { color: #475569; }
          .table-container { margin-top: 30px; display: flex; gap: 20px; }
          .column { flex: 1; }
          table { width: 100%; border-collapse: collapse; font-size: 14px; }
          th { background: #e0f2fe; text-align: left; padding: 8px 12px; color: #0369a1; }
          td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
          .amount { text-align: right; }
          .summary { margin-top: 30px; background: #0f172a; color: #fff; padding: 20px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
          .net-amount { font-size: 26px; font-weight: bold; color: #38bdf8; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company">${config.companyName}</div>
            <div style="font-size: 13px; color: #64748b;">Official Salary Statement</div>
          </div>
          <div>
            <div class="title">PAYSLIP</div>
            <div style="font-size: 13px; color: #64748b; text-align: right;">${periodName}</div>
          </div>
        </div>

        <div class="meta">
          <div class="meta-item"><strong>Employee ID:</strong> ${payslip.employeeCode}</div>
          <div class="meta-item"><strong>Employee Name:</strong> ${payslip.employeeName}</div>
          <div class="meta-item"><strong>Department:</strong> ${payslip.department}</div>
          <div class="meta-item"><strong>Position:</strong> ${payslip.position}</div>
          <div class="meta-item"><strong>Payment IBAN:</strong> ${payslip.bankIban}</div>
          <div class="meta-item"><strong>Working / Absent Days:</strong> ${payslip.workingDays} days / ${payslip.absentDays} days</div>
        </div>

        <div class="table-container">
          <div class="column">
            <table>
              <thead>
                <tr><th>Earnings</th><th class="amount">Amount</th></tr>
              </thead>
              <tbody>
                ${earnings.map(e => `
                  <tr>
                    <td>${e.label}</td>
                    <td class="amount">${formatCurrency(e.amount, config.currency)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="column">
            <table>
              <thead>
                <tr><th>Deductions</th><th class="amount">Amount</th></tr>
              </thead>
              <tbody>
                ${deductions.map(d => `
                  <tr>
                    <td>${d.label}</td>
                    <td class="amount">${formatCurrency(d.amount, config.currency)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="summary">
          <div>
            <div style="font-size: 14px; opacity: 0.8;">Total Gross Pay: ${formatCurrency(payslip.grossPay, config.currency)}</div>
            <div style="font-size: 14px; opacity: 0.8;">Total Deductions: ${formatCurrency(payslip.totalDeductions, config.currency)}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Net Transfer Amount</div>
            <div class="net-amount">${formatCurrency(payslip.netPay, config.currency)}</div>
          </div>
        </div>

        <div class="footer">
          Computer generated payslip. No physical signature required. Verified by Apex Payroll System Engine.
        </div>
      </body>
      </html>
    `;
  }
}
