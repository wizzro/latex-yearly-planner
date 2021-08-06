const {DateTime} = require('luxon');
const {fmtDay, interpolateTpl, makeRow} = require('./funcs');
const m = require('./month');

export const header = (llist: Array<any>, rlist: Array<any>): string =>
  `{%
    \\noindent\\Large%
    \\renewcommand{\\arraystretch}{\\myNumArrayStretch}%
    \\begin{tabular}{|${new Array(llist.length).fill('l').join(' | ')}}
        ${llist.join(' & ')}
    \\end{tabular}
    \\hfill%
    ${!rlist ? '' : `\\begin{tabular}{${new Array(rlist.length).fill('r').join(' | ')}@{}}
      ${rlist.join(' & ')}
      \\end{tabular}
    `}
}
\\myHfillThick\\medskip`;

export const link = (ref: string, text: string): string =>
  `\\hyperlink{${ref}}{${text}}`;

export const slink = (reftext: string): string =>
  `\\hyperlink{${reftext}}{${reftext}}`;

export const target = (ref: string, text: string): string =>
  `\\hypertarget{${ref}}{${text}}`;

export const starget = (reftext: string): string =>
  `\\hypertarget{${reftext}}{${reftext}}`;

export const tabularx = ({
  colSetup,
  hlines,
  matrix
}: { colSetup: string, hlines: boolean, matrix: Array<Array<string>> }): string => {
  const hline = hlines ? '\\hline' : '';

  return `\\begin{tabularx}{\\linewidth}{${colSetup}}
${hline}
${matrix.map(row => row.join(' & ')).join(`\\\\ ${hline} \n`)} ${hlines ? '\\\\ \\hline \n' : ''}
\\end{tabularx}`
}

const linkifyWeekNumbers = (month, item) =>
  month === 0 && item > 50
    ? link('fwWeek ' + item, item)
    : link('Week ' + item, item);

const linkifyDays = (year, month, row) =>
  row.map(date => !date ? '' : link(fmtDay(year, month, date), date));

export const monthlyTabular = ({
  year,
  month,
  weeks = true,
  weekStart = 1
}: { year: number, month: number, weeks?: boolean, weekStart?: 1 | 7 }): string => {
  let calendar = m.month(year, month, weekStart);

  if (weeks) {
    calendar.forEach(row => {
      const day = row.find(day => day && DateTime.local(year, month, day).weekday === 1) || row.find(item => item);
      row.unshift(DateTime.local(year, month, day).weekNumber)
    });
    calendar = calendar.map(row => [linkifyWeekNumbers(month, row[0]), ...row.slice(1)])
  }

  calendar = calendar
    .map(row => row.map(item => item ? item.toString() : ''))
    .map(row => {
      const linkifiedDays = linkifyDays(year, month, weeks ? row.slice(1) : row);
      return weeks ? [row[0], ...linkifiedDays] : linkifiedDays;
    })
    .map(makeRow)
    .join('\\\\ \n')

  return interpolateTpl('calendar', {
    monthName: slink(DateTime.local(year, month).monthLong),
    colWeek: weeks ? 'c|' : '',
    colSetup: weekStart === 1 ? 'c'.repeat(6) + '>{\\bf}c' : '>{\\bf}c' + 'c'.repeat(6),
    weekColumn: weeks ? 'c | ' : '',
    columns: weeks ? 8 : 7,
    weekTag: weeks ? 'W &' : '',
    weekLayout: weekStart === 1 ? 'M & T & W & T & F & S & S' : 'S & M & T & W & T & F & S',
    calendar
  });
};
