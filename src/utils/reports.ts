import moment from 'moment';

// Calculate working days between two dates (excludes weekends)
export const calculateWorkingDays = (startDate: Date, endDate: Date): number => {
  let days = 0;
  let current = moment(startDate);
  const end = moment(endDate);

  while (current.isSameOrBefore(end)) {
    const dayOfWeek = current.day();
    // Monday to Friday (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days++;
    }
    current.add(1, 'day');
  }

  return days;
};

// Calculate headcount by department
export const calculateHeadcountByDepartment = (employees: any[]) => {
  const result: Record<string, number> = {};
  employees.forEach(emp => {
    if (emp.status === 'active') {
      result[emp.department] = (result[emp.department] || 0) + 1;
    }
  });
  return result;
};

// Calculate turnover rate
export const calculateTurnoverRate = (
  totalEmployees: number,
  separations: number,
  periodInMonths: number
): number => {
  if (totalEmployees === 0) return 0;
  const annualized = (separations / totalEmployees) * (12 / periodInMonths) * 100;
  return parseFloat(annualized.toFixed(2));
};

// Calculate absence rate
export const calculateAbsenceRate = (
  totalWorkingDays: number,
  absentDays: number
): number => {
  if (totalWorkingDays === 0) return 0;
  return (absentDays / totalWorkingDays) * 100;
};

// Format currency for HKD
export const formatHKD = (amount: number): string => {
  return new Intl.NumberFormat('zh-HK', {
    style: 'currency',
    currency: 'HKD'
  }).format(amount);
};

// Generate employee report
export const generateEmployeeReport = (employees: any[]) => {
  const active = employees.filter(e => e.status === 'active').length;
  const inactive = employees.filter(e => e.status === 'inactive').length;
  const terminated = employees.filter(e => e.status === 'terminated').length;
  const onLeave = employees.filter(e => e.status === 'on-leave').length;

  const byDepartment = calculateHeadcountByDepartment(employees);

  return {
    total: employees.length,
    active,
    inactive,
    terminated,
    onLeave,
    byDepartment
  };
};

// Generate payroll summary report
export const generatePayrollSummary = (payrolls: any[]) => {
  const totalNetPay = payrolls.reduce((sum, p) => sum + p.netPay, 0);
  const totalGrossPay = payrolls.reduce((sum, p) => sum + p.grossPay, 0);
  const totalMPF = payrolls.reduce((sum, p) => sum + p.mpfContribution, 0);
  const byStatus: Record<string, number> = {};

  payrolls.forEach(p => {
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
  });

  return {
    count: payrolls.length,
    totalNetPay,
    totalGrossPay,
    totalMPF,
    byStatus,
    averageNetPay: totalNetPay / payrolls.length
  };
};
