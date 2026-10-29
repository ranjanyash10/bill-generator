export function numberToWordsINR(amount: number): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Zero Rupees Only';
  }

  const absAmount = Math.abs(amount);
  let rupees = Math.floor(absAmount);
  let paise = Math.round((absAmount - rupees) * 100);

  if (paise === 100) {
    rupees += 1;
    paise = 0;
  }

  if (rupees === 0 && paise === 0) {
    return 'Zero Rupees Only';
  }

  const units = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function twoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 20) return units[n];
    const rem = n % 10;
    return (tens[Math.floor(n / 10)] + (rem > 0 ? ' ' + units[rem] : '')).trim();
  }

  function threeDigits(n: number): string {
    const h = Math.floor(n / 100);
    const rem = n % 100;
    const parts: string[] = [];
    if (h > 0) parts.push(units[h] + ' Hundred');
    if (rem > 0) parts.push(twoDigits(rem));
    return parts.join(' ').trim();
  }

  const wordsParts: string[] = [];
  const crores = Math.floor(rupees / 10000000);
  const remCr = rupees % 10000000;
  const lakhs = Math.floor(remCr / 100000);
  const remLakh = remCr % 100000;
  const thousands = Math.floor(remLakh / 1000);
  const remTh = remLakh % 1000;

  if (crores > 0) {
    wordsParts.push(crores >= 100 ? threeDigits(crores) + ' Crore' : twoDigits(crores) + ' Crore');
  }
  if (lakhs > 0) {
    wordsParts.push(twoDigits(lakhs) + ' Lakh');
  }
  if (thousands > 0) {
    wordsParts.push(twoDigits(thousands) + ' Thousand');
  }
  if (remTh > 0) {
    wordsParts.push(threeDigits(remTh));
  }

  const rupeeStr = wordsParts.join(' ').trim();
  let result = amount < 0 ? 'Minus ' : '';

  if (rupeeStr) {
    result += `${rupeeStr} Rupee${rupees !== 1 ? 's' : ''}`;
    if (paise > 0) {
      result += ` and ${twoDigits(paise)} Paise`;
    }
  } else if (paise > 0) {
    result += `${twoDigits(paise)} Paise`;
  }

  result += ' Only';
  return result;
}
